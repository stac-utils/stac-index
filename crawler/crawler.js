const axios = require('axios');
const Utils = require('lodash');
const URI = require('urijs');
const Logger = require('./logger');
const Database = require('./database');
const { Range } = require("pg-range");

const SUPPORTED_PROTOCOLS = ['http', 'https'];

// Some files (especially AWS?) send back JSON as binary/octet-stream, handle that (TODO: check this actually helps)
axios.interceptors.response.use(function (response) {
	if (response.headers['content-type'] === 'binary/octet-stream') {
		response.headers['content-type'] = 'application/json';
	}
	return response;
});

module.exports = class Crawler {

	constructor(pool, q, crawlAllItems = true, timeout = 2000) {
		this.logger = new Logger(q.url);
		if (pool instanceof Database) {
			this.db = pool;
		}
		else {
			this.db = new Database(pool, this.logger);
		}
		this.allItems = crawlAllItems; // Crawl all items or just one per catalog?
		this.timeout = timeout; // Timeout for requests
		this.url =  q.url;
		this.catalog = q.catalog;
		this.attempt = q.checks + 1;
		this.type = q.type;
		this.links = {};
	}

	async crawl() {
		await this.db.connect();

		// set last access time and increase check number
		const sql = `
			UPDATE queue
			SET accessed = NOW(), checks = checks + 1
			WHERE url = $1
		`;
		await this.db.query(sql, [this.url]);
	
		try {
			await this.db.query('BEGIN');
			if (await this.parseUrl() !== false) {
				// Set crawl time
				const sql = `
					UPDATE queue
					SET crawled = NOW(), checks = 0, type = $2
					WHERE url = $1
				`;
				await this.db.query(sql, [this.url, this.type]);
				await this.db.query('COMMIT');
//				this.logger.log('OK');
			}
			else {
				await this.db.query('ROLLBACK');
			}
		} catch (error) {
			await this.db.query('ROLLBACK');
			this.logger.error(error);
		}
		this.db.release();
	}
	
	async parseUrl() {
		let data;
		try {
			data = await this.request();
		} catch(error) {
			this.logger.warn(error);
			return false;
		}
		if (!Utils.isPlainObject(data)) {
			this.logger.warn("Invalid response");
			return false;
		}
		this.type = this.detectStacType(data);
		if (this.type === null) {
			this.logger.warn("Response is not STAC");
			return false;
		}
		this.links = this.linksByRel(data.links);
		await this.addLinksToQueue(this.links, this.type);
		switch(this.type) {
			case 'item':
				return await this.addItem(data, await this.getCollectionId());
			case 'catalog':
				return true;
			case 'collection':
				return await this.addCollection(data);
			case 'itemcollection':
				return await this.addLinksFromResources(data, 'features', 'item');
			case 'collections':
				return await this.addLinksFromResources(data, 'collections', 'collection');
			default:
				this.logger.error("Type not implemented");
				return false;
		}
	}
	
	async getCollectionId() {
		if (Array.isArray(this.links.collection) && this.links.collection.length > 0) {
			let res = await this.db.query(`SELECT id FROM collections WHERE url = $1`, [this.links.collection[0].href]);
			if (res.rows.length > 0) {
				return res.rows[0].id;
			}
		}
		return null;
	}
	
	async addLinksFromResources(data, key, type) {
		if (data[key].length === 0) {
			return true;
		}
		let count = 0;
		for(let obj of data[key]) {
			try {
				let links = this.linksByRel(obj.links);
				let url;
				if (links.self && links.self.length > 0) {
					url = links.self[0].href;
				}
				else if (typeof obj.id === 'string') {
					url = this.addPathElement(this.url, encodeURIComponent(obj.id));
				}
				await this.insertToQueue(url, type, this.catalog, this.url);
				count++;
			} catch (error) {
				this.logger.error(error);
			}
		}
		return (count > 0);
	}
	
	async addItem(source, collection = null) {
		let data = {
			url: this.url,
			catalog: this.catalog,
			stac_version: typeof source.stac_version === 'string' ? source.stac_version : null,
			collection
		};
		let id = await this.upsertFromObject(data, 'items', 'url');
		await this.addStacExtensions(source.stac_extensions, id, 'item');
		return id;
	}
	
	async addCollection(source) {
		let temporal = [];
		let spatial = [];
		if (Utils.isPlainObject(source.extent)) {
			if (Utils.isPlainObject(source.extent.temporal) && Array.isArray(source.extent.temporal.interval)) {
				try {
					temporal = source.extent.temporal.interval
						.filter(i => Array.isArray(i) && i.length === 2 && (typeof i[0] === 'string' || typeof i[1] === 'string'))
						.map(i => Range(
							typeof i[0] === 'string' ? new Date(i[0]) : null,
							typeof i[1] === 'string' ? new Date(i[1]) : null,
							'[)'
						));
				} catch (error) {
					this.logger.warn(error);
				}
			}
	
			if (Utils.isPlainObject(source.extent.spatial) && Array.isArray(source.extent.spatial.bbox)) {
				try {
					spatial = source.extent.spatial.bbox
						.filter(b => Array.isArray(b) && (b.length === 4 || b.length === 6) && b.filter(n => typeof n !== 'number').length === 0);
				} catch (error) {
					this.logger.warn(error);
				}
			}
		}

		let data = {
			url: this.url,
			catalog: this.catalog,
			stac_version: typeof source.stac_version === 'string' ? source.stac_version.toLowerCase() : null,
			stac_id: (typeof source.id === 'string' && source.id.length <= 150) ? source.id : null,
			title: typeof source.title === 'string' ? source.title : null,
			description: typeof source.description === 'string' ? source.description : null,
			license: (typeof source.license === 'string' && source.license.match(/^[\w\.\-]+$/i)) ? source.license.toLowerCase() : null,
			spatial_extent: spatial,
			temporal_extent: temporal,
			source,
			doi: (typeof source['sci:doi'] === 'string' && source['sci:doi'].length <= 150) ? source['sci:doi'] : null,
			deprecated: typeof source.deprecated === 'boolean' ? source.deprecated : false
		};
		let id = await this.upsertFromObject(data, 'collections', 'url');
		await this.addStacExtensions(source.stac_extensions, id, 'collection');
		await this.addKeywords(source.keywords, id);
		return id;
	}
	
	makeStringSet(arr, maxLength) {
		return arr
			.map(v => v.trim().toLowerCase())
			.filter((v, i, self) => (typeof v === 'string' && v.length > 0 && v.length < maxLength && self.indexOf(v) === i));
	}
	
	async addKeywords(keywords, id) {
		if (!Array.isArray(keywords)) {
			return;
		}
	
		keywords = this.makeStringSet(keywords, 200);
		for(let keyword of keywords) {
			const sql = `
				WITH keywords AS (INSERT INTO keywords (keyword) VALUES ($1) ON CONFLICT (keyword) DO UPDATE SET keyword = $1 RETURNING id)
				INSERT INTO collection_keywords (collection, keyword)
				VALUES ($2, (SELECT id FROM keywords))
				ON CONFLICT DO NOTHING
			`;
			await this.db.query(sql, [keyword, id]);
		}
	}
	
	async addStacExtensions(extensions, id, type) {
		if (!Array.isArray(extensions)) {
			return;
		}
	
		extensions = this.makeStringSet(extensions, 255);
		for(let extension of extensions) {
			const sql = `
				WITH extensions AS (INSERT INTO stac_extensions (extension) VALUES ($1) ON CONFLICT (extension) DO UPDATE SET extension = $1 RETURNING id)
				INSERT INTO ${type}_extensions (${type}, extension)
				VALUES ($2, (SELECT id FROM extensions))
				ON CONFLICT DO NOTHING
			`;
			await this.db.query(sql, [extension, id]);
		}
	}
	
	addPathElement(baseUrl, component) {
		return baseUrl.replace(/\/+$/, '') + '/' + component
	}
	
	detectStacType(data) {
		if (!Utils.isPlainObject(data)) {
			return null;
		}
		let type = null;
		let hasVersion = (typeof data.stac_version === 'string');
		if (typeof data.type !== 'undefined') {
			if (data.type === 'Feature' && hasVersion) {
				type = 'item';
			}
			else if (data.type === 'FeatureCollection') {
				type = 'itemcollection';
			}
		}
		else if (hasVersion) {
			if (typeof data.extent !== 'undefined' || typeof data.license !== 'undefined') {
				type = 'collection';
	
			}
			else {
				type = 'catalog';
			}
		}
		else if (Array.isArray(data.collections)) {
			type = 'collections';
		}
		return type;
	}
	
	linksByRel(links) {
		let rels = {};
		for(let link of links) {
			if (typeof link.type === 'string' && link.type !== 'application/json') {
				continue; // Ignore all links that are clearly non-JSON 
			}
			if (typeof link.method === 'string' && link.method.toLowerCase() !== 'get') {
				continue; // Ignore all links that are clearly non-GET method
			}
			if (typeof link.rel === 'string') {
				if (!Array.isArray(rels[link.rel])) {
					rels[link.rel] = [];
				}
				rels[link.rel].push(link);
			}
		}
		return rels;
	}
	
	async addLinksToQueue(links, type) {
		let baseUrl = this.url;
		if (Array.isArray(links.self) && links.self.length > 0) {
			let self = links.self[0].href;
			if (URI(self).protocol()) { // Ensure self is absolute
				baseUrl = self;
			}
		}
		// parent/root: ignore for now, I can't detect whether it's part actually part of the catalog (id)
		// item
		if (Array.isArray(links.item)) {
			if (this.allItems) {
				for(let link of links.item) {
					await this.insertToQueue(link.href, 'item', this.catalog, baseUrl);
				}
			}
			else {
				let randomIndex = Math.floor(Math.random() * links.item.length);
				await this.insertToQueue(links.item[randomIndex].href, 'item', this.catalog, baseUrl);
			}
		}
		// child
		if (Array.isArray(links.child)) {
			for(let link of links.child) {
				// Try to guess whether something is a collection from the file name
				let typeGuess = typeof link.href === 'string' && link.href.endsWith('collection.json') ? 'collection' : 'catalog';
				await this.insertToQueue(link.href, typeGuess, this.catalog, baseUrl);
			}
		}
		// items
		if (Array.isArray(links.items) && links.items.length > 0) {
			await this.insertToQueue(links.items[0].href, 'items', this.catalog, baseUrl);
		}
		// data
		if (Array.isArray(links.data) && links.data.length > 0) {
			await this.insertToQueue(links.data[0].href, 'collections', this.catalog, baseUrl);
		}
		// collection
		if (Array.isArray(links.collection) && links.collection.length > 0) {
			await this.insertToQueue(links.collection[0].href, 'collection', this.catalog, baseUrl, (type === 'item')); // Force crawl for items so that we have a collection id
		}
		// next
		if (Array.isArray(links.next) && links.next.length > 0 && (this.allItems || !type.includes('item'))) {
			await this.insertToQueue(links.next[0].href, type, this.catalog, baseUrl);
		}
	}
	
	async request() {
		let response = await axios({
			url: this.url,
			method: 'get',
			headers: {
				'Accept-Encoding': 'gzip,deflate,compress',
				'Accept': 'application/json,text/json,*/*;q=0.8',
				'Cache-Control': 'nocache',
				'User-Agent': 'Mozilla/5.0 (compatible; StacIndexCrawler/0.1.0; +https://stacindex.org) Gecko/20100101 Firefox/84.0'
			}, // request http headers
			timeout: 2000 * this.attempt, // request timeout, give more time for further attempts
			responseType: 'json',
			responseEncoding: 'utf8',
			maxRedirects: 2 * this.attempt, // max number of redirects, allow more redirects for further attempts
			decompress: true
		});
		return response.data;
	}
	
	async insertToQueue(url, type, catalog, baseUrl = null, forceCrawl = false) {
		if (typeof url === 'string' && catalog > 0) {
			url = url.trim();
			let protocol = URI(url).protocol();
			if (!protocol && typeof baseUrl === 'string') {
				// Relative URL, add baseUrl
				try {
					let baseUri = URI(baseUrl).filename('');
					let uri = URI(url).absoluteTo(baseUri);
					url = uri.toString();
					protocol = uri.protocol();
				} catch (error) {
					this.logger.warn(`Can't merge URLs '${baseUrl}' and '${url}', can't add to queue`);
					return;
				}
			}
			if (!protocol) {
				this.logger.warn(`URL is relative '${url}', can't add to queue`);
				return;
			}
			else if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
				this.logger.log(`Protocol ${protocol} currently not supported, still adding to queue for later`);
			}
	
			const sql = `
				INSERT INTO queue (url, type, catalog)
				VALUES ($1, $2, $3)
				ON CONFLICT (url) DO UPDATE
					SET checks = 0, accessed = NULL
				RETURNING *
			`;
			let res = await this.db.query(sql, [url, type, catalog]);
			if (forceCrawl) {
				let collectionCrawler = new Crawler(this.db, res.rows[0], this.allItems, this.timeout);
				await collectionCrawler.crawl();
			}
		}
	}
	
	async upsertFromObject(data, table, conflict) {
		const columns = Object.keys(data);
		const values = Object.values(data);
		const withs = [];
		const placeholders = [];
		let placeholderCount = 1;
		for(var i = 0; i < columns.length; i++) {
			let placeholder = `$${placeholderCount}`;
			let k = columns[i];
			if ((k === 'license' || k === 'stac_version') && values[i] !== null) {
				let cte = {
					stac_version: `temp_versions AS (INSERT INTO stac_versions (version) VALUES (${placeholder}) ON CONFLICT (version) DO UPDATE SET version = ${placeholder} RETURNING id)`,
					license: `temp_licenses AS (INSERT INTO licenses (license) VALUES (${placeholder}) ON CONFLICT (license) DO UPDATE SET license = ${placeholder} RETURNING id)`
				};
				let select = {
					stac_version: `(SELECT id FROM temp_versions)`,
					license: `(SELECT id FROM temp_licenses)`
				};
				withs.push(cte[k]);
				placeholders.push(select[k]);
				placeholderCount++;
			}
			else if (k === 'spatial_extent' && Array.isArray(values[i]) && values[i].length > 0) {
				let postgis = values[i].map(b => {
					// 3rd dimension is dropped for now
					let x2 = b.length === 6 ? 3 : 2;
					let y2 = b.length === 6 ? 4 : 3
					return `ST_MakeEnvelope(${b[0]}, ${b[1]}, ${b[x2]}, ${b[y2]}, 4326)`;
				});
				placeholders.push(`ARRAY[ ${postgis.join(', ')} ]`);
				values.splice(i, 1);
			}
			else {
				placeholders.push(placeholder);
				placeholderCount++;
			}
		}
		const update = Object.keys(data).map((v, k) => `${v} = ${placeholders[k]}`);
		const withcte = withs.length > 0 ? `WITH ${withs.join(', ')}` : '';
		const sql = `
			${withcte}
			INSERT INTO ${table} (${columns.join(', ')})
			VALUES (${placeholders.join(', ')})
			ON CONFLICT (${conflict}) DO
				UPDATE SET ${update.join(', ')}
			RETURNING id
		`;
		const res = await this.db.query(sql, values);
		return res.rows[0].id;
	}

}