
const pg = require('pg');
const pgr = require("pg-range")
const axios = require('axios');
const Utils = require('lodash');
const { DATABASE } = require('../commons');
const logger = require('./logger');
const URI = require('urijs');

const SUPPORTED_PROTOCOLS = ['http', 'https'];
const CRAWL_ALL_ITEMS = false;

// Add range support to node pg driver
pgr.install(pg);

// Create new pg connection pool and connect
const pool = new pg.Pool(DATABASE);
var db;

console.info("START");

/*
 TODOs:
 - Fix all "Todos" 
 - parallelize
 - fix: validate fields better (e.g. stac_version with regexp, remove https://doi.org/ prefix from DOIs)
 - fix: Temporal extents with start = end give {empty} in db, e.g. https://portal.opentopography.org/stac/CA17_Guns_catalog.json
 - remove html from description (html-to-text)
 - don't index collection version? Doesn't seem useful for search...
 - fix: remove the superfluous `ON CONFLICT (...) UPDATE` statements 
   with something more meaningful: https://stackoverflow.com/a/42217872
   For example put multiple queries into a pl/pqsql script / function
 - Implement summary handling 
   - create tables dynamically
   - create summaries from items
 */

run().catch(error => logger.error(error));

async function run() {
	db = await pool.connect();

	// Clean up queue daily (and now)
	await cleanQueue();
	setInterval(cleanQueue, 24*60*60*1000);

	// Add new catalogs to queue every hour (and now)
	await insertCatalogsToQueue();
	setInterval(insertCatalogsToQueue, 60*60*1000);
	
	return await crawl();
}

async function crawl() {
	do {
		// New entries: accessed = NULL, checks = 0, crawled = NULL
		// New entries with failures: accessed = time, checks = >= 1, crawled = NULL
		// Crawled entries: accessed = time, checks = 0, crawled = time
		const sql = `
			SELECT *
			FROM queue
			WHERE
				accessed IS NULL   -- New entries
				OR (accessed < (NOW() - INTERVAL '1 WEEK') AND checks BETWEEN 1 AND 4)   -- On failue, try again after a week, stop after 4 weeks
				OR (crawled < (NOW() - INTERVAL '1 YEAR') OR accessed < (NOW() - INTERVAL '1 YEAR'))   -- Recrawl every year
			ORDER BY
				checks ASC, -- Prio for new entries
				CASE type -- Prio: 1. collection, 2. collections, 3. catalog, 4. itemcollection/items, 5. item
					WHEN 'collection' THEN 1
					WHEN 'collections' THEN 2
					WHEN 'catalog' THEN 3
					WHEN 'itemcollection' THEN 4
					WHEN 'items' THEN 4
					ELSE 5
				END,
				CASE -- Less prio for the large catalogs, TODO: don't hardcode...
					WHEN url LIKE '%cmr.earthdata.nasa.gov%' THEN 1
					ELSE 0
				END,
				RANDOM() -- Don't pressure one server too much, choose random entries
			LIMIT 100
		`;
		const res = await query(sql, []);
		if (res.rows.length === 0) {
			// If nothing more was available to crawl, make a break for an hour
			setTimeout(crawl, 60*60*1000);
			logger.log("Nothing to crawl, trying again in an hour...");
			return;
		}

		// Index entries from queue
		for(let q of res.rows) {
			await crawlFromQueue(q);
		}
	} while(true);
}

async function crawlFromQueue(q) {
	try {
		logger.log("Crawling: " + q.url);
		// set last access time and increase check number
		const sql = `
			UPDATE queue
			SET accessed = NOW(), checks = checks + 1
			WHERE url = $1
		`;
		await query(sql, [q.url]);
	
		try {
			await query('BEGIN');
			if (await parseUrl(q) !== false) {
				// Set crawl time
				const sql = `
					UPDATE queue
					SET crawled = NOW(), checks = 0
					WHERE url = $1
				`;
				await query(sql, [q.url]);
			}
			await query('COMMIT');
		  } catch (error) {
			await query('ROLLBACK');
			logger.error(error);
		  }
	} catch (error) {
		logger.error(error);
	}
}

async function parseUrl(q) {
	let data = await request(q);
	if (!Utils.isPlainObject(data)) {
		logger.log("Invalid response");
		return false;
	}
	let type = detectStacType(data);
	if (type === null) {
		logger.log("Response is not STAC");
		return false;
	}
	let links = linksByRel(data.links);
	await addLinksToQueue(links, q.catalog, type, q.url);
	switch(type) {
		case 'item':
			// Get id for corresponding collection
			let collection = null;
			if (Array.isArray(links.collection) && links.collection.length > 0) {
				let collectionUrl = links.collection[0].href;
				let res = await query(`SELECT id FROM collections WHERE url = $1`, [collectionUrl]);
				if (res.rows.length > 0) {
					collection = res.rows[0].id;
				}
			}
			// Add item
			return await addItem(data, q, collection);
		case 'catalog':
			return true;
		case 'collection':
			return await addCollection(data, q);
		case 'itemcollection':
			return await addLinksFromResources(q, data, 'features', 'item');
		case 'collections':
			return await addLinksFromResources(q, data, 'collections', 'collection');
	}
	return false;
}

async function addLinksFromResources(q, data, key, type) {
	for(let obj of data[key]) {
		let links = linksByRel(obj.links);
		let url;
		if (links.self && links.self.length > 0) {
			url = links.self[0].href;
		}
		else if (typeof obj.id === 'string') {
			url = addPathElement(q.url, encodeURIComponent(obj.id));
		}
		await insertToQueue(url, type, q.catalog);
	}
	return true;
}

async function addItem(source, q, collection = null) {
	let data = {
		url: q.url,
		catalog: q.catalog,
		stac_version: typeof source.stac_version === 'string' ? source.stac_version : null,
		collection
	};
	let id = await upsertFromObject(data, 'items', 'url');
	await addStacExtensions(source.stac_extensions, id, 'item');
	return id;
}

async function addCollection(source, q) {
	let temporal = [];
	let spatial = [];
	if (Utils.isPlainObject(source.extent)) {
		if (Utils.isPlainObject(source.extent.temporal) && Array.isArray(source.extent.temporal.interval)) {
			try {
				temporal = source.extent.temporal.interval
					.filter(i => Array.isArray(i) && i.length === 2 && (typeof i[0] === 'string' || typeof i[1] === 'string'))
					.map(i => pgr.Range(
						typeof i[0] === 'string' ? new Date(i[0]) : null,
						typeof i[1] === 'string' ? new Date(i[1]) : null,
						'[)'
					));
			} catch (error) {
				logger.log(error);
			}
		}

		if (Utils.isPlainObject(source.extent.spatial) && Array.isArray(source.extent.spatial.bbox)) {
			try {
				spatial = source.extent.spatial.bbox
					.filter(b => Array.isArray(b) && (b.length === 4 || b.length === 6) && b.filter(n => typeof n !== 'number').length === 0);
			} catch (error) {
				logger.log(error);
			}
		}
	}


	let data = {
		url: q.url,
		catalog: q.catalog,
		stac_version: typeof source.stac_version === 'string' ? source.stac_version.toLowerCase() : null,
		stac_id: (typeof source.id === 'string' && source.id.length <= 150) ? source.id : null,
		title: typeof source.title === 'string' ? source.title : null,
		description: typeof source.description === 'string' ? source.description : null,
		license: (typeof source.license === 'string' && source.license.match(/^[\w\.\-]+$/i)) ? source.license.toLowerCase() : null,
		spatial_extent: spatial,
		temporal_extent: temporal,
		source,
		doi: (typeof source['sci:doi'] === 'string' && source['sci:doi'].length <= 150) ? source['sci:doi'] : null,
		version: (typeof source.version === 'string' && source.version.length <= 50) ? source.version : null,
		deprecated: typeof source.deprecated === 'boolean' ? source.deprecated : false
	};
	let id = await upsertFromObject(data, 'collections', 'url');
	await addStacExtensions(source.stac_extensions, id, 'collection');
	await addKeywords(source.keywords, id);
	return id;
}

function makeStringSet(arr, maxLength) {
	return arr
		.map(v => v.trim().toLowerCase())
		.filter((v, i, self) => (typeof v === 'string' && v.length > 0 && v.length < maxLength && self.indexOf(v) === i));
}

async function addKeywords(keywords, id) {
	if (!Array.isArray(keywords)) {
		return;
	}

	keywords = makeStringSet(keywords, 200);
	for(let keyword of keywords) {
		const sql = `
			WITH keywords AS (INSERT INTO keywords (keyword) VALUES ($1) ON CONFLICT (keyword) DO UPDATE SET keyword = $1 RETURNING id)
			INSERT INTO collection_keywords (collection, keyword)
			VALUES ($2, (SELECT id FROM keywords))
			ON CONFLICT DO NOTHING
		`;
		await query(sql, [keyword, id]);
	}
}

async function addStacExtensions(extensions, id, type) {
	if (!Array.isArray(extensions)) {
		return;
	}

	extensions = makeStringSet(extensions, 255);
	for(let extension of extensions) {
		const sql = `
			WITH extensions AS (INSERT INTO stac_extensions (extension) VALUES ($1) ON CONFLICT (extension) DO UPDATE SET extension = $1 RETURNING id)
			INSERT INTO ${type}_extensions (${type}, extension)
			VALUES ($2, (SELECT id FROM extensions))
			ON CONFLICT DO NOTHING
		`;
		await query(sql, [extension, id]);
	}
}

function addPathElement(baseUrl, component) {
	return baseUrl.replace(/\/+$/, '') + '/' + component
}

function detectStacType(data) {
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

function linksByRel(links) {
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

async function addLinksToQueue(links, catalog, type, baseUrl = null) {
	if (Array.isArray(links.self) && links.self.length > 0) {
		let self = links.self[0].href;
		if (URI(self).protocol()) { // Ensure self is absolute
			baseUrl = self;
		}
	}
	// parent/root: ignore for now, I can't detect whether it's part actually part of the catalog (id)
	// item
	if (Array.isArray(links.item)) {
		if (CRAWL_ALL_ITEMS) {
			for(let link of links.item) {
				await insertToQueue(link.href, 'item', catalog, baseUrl);
			}
		}
		else {
			let randomIndex = Math.floor(Math.random() * links.item.length);
			await insertToQueue(links.item[randomIndex].href, 'item', catalog, baseUrl);
		}
	}
	// child
	if (Array.isArray(links.child)) {
		for(let link of links.child) {
			await insertToQueue(link.href, 'catalog', catalog, baseUrl);
		}
	}
	// items
	if (Array.isArray(links.items) && links.items.length > 0) {
		await insertToQueue(links.items[0].href, 'items', catalog, baseUrl);
	}
	// data
	if (Array.isArray(links.data) && links.data.length > 0) {
		await insertToQueue(links.data[0].href, 'collections', catalog, baseUrl);
	}
	// collection
	if (Array.isArray(links.collection) && links.collection.length > 0) {
		await insertToQueue(links.collection[0].href, 'collection', catalog, baseUrl, (type === 'item')); // Force crawl for items so that we have a collection id
	}
	// next
	if (Array.isArray(links.next) && links.next.length > 0 && (CRAWL_ALL_ITEMS || !type.includes('item'))) {
		await insertToQueue(links.next[0].href, type, catalog, baseUrl);
	}
}

async function request(q) {
	try {
		let attempt = q.checks + 1;
		let response = await axios({
			url: q.url,
			method: 'get',
			headers: {
				'Accept-Encoding': 'gzip,deflate,compress',
				'Accept': 'application/json,text/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0'
			}, // request http headers
			timeout: 2000 * attempt, // request timeout, give more time for further attempts
			responseType: 'json',
			responseEncoding: 'utf8',
			maxRedirects: 2 * attempt, // max number of redirects, allow more redirects for further attempts
			decompress: true
		});
		return response.data;
	} catch(error) {
		logger.error(error.message);
		return null;
	}
}

async function insertToQueue(url, type, catalog, baseUrl = null, forceCrawl = false) {
	if (typeof url === 'string' && catalog > 0) {
		url = url.trim();
		let protocol = URI(url).protocol();
		if (!protocol && baseUrl) {
			// Relative URL, add baseUrl
			try {
				let uri = URI(baseUrl).filename('').absoluteTo(url);
				url = uri.toString();
				protocol = uri.protocol();
			} catch (error) {
				logger.error(`Can't merge URLs '${baseUrl}' and '${url}', can't add to queue`);
				return;
			}
		}
		if (!protocol) {
			logger.error(`URL is relative '${url}', can't add to queue`);
			return;
		}
		else if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
			logger.log(`Protocol ${protocol} currently not supported, still adding to queue for later`);
		}

		try {
			const sql = `
				INSERT INTO queue (url, type, catalog)
				VALUES ($1, $2, $3)
				ON CONFLICT (url) DO UPDATE
					SET checks = 0, accessed = NULL
				RETURNING *
			`;
			let res = await query(sql, [url, type, catalog]);
			if (forceCrawl) {
				crawlFromQueue(res.rows[0]);
			}
		} catch(error) {
			logger.error(error);
		}
	}
}

async function insertCatalogsToQueue() {
	logger.log("Insert catalogs into queue (if not exists)");
	try {
		const sql = `
			INSERT INTO queue (url, catalog, type)
			SELECT url, id, 'catalog' AS type FROM catalogs
			ON CONFLICT DO NOTHING
		`;
		await query(sql);
	} catch(error) {
		logger.error(error);
	}
}

async function cleanQueue() {
	logger.log("Clean up queue");
	try {
		await query('DELETE FROM queue WHERE checks > 4');
	} catch(error) {
		logger.error(error);
	}
}

async function upsertFromObject(data, table, conflict) {
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
	const res = await query(sql, values);
	return res.rows[0].id;
}

async function query(sql, values) {
	try {
		return await db.query(sql, values);
	} catch (error) {
		logger.error("Error in the following query:\n" + sql);
		logger.error(values);
		throw error;
	}
}