const LANGUAGES = require('list-of-programming-languages');
const { Pool } = require('pg');
const axios = require('axios');
const Utils = require('lodash');
const Levenshtein = require('levenshtein');
const { EXTENSIONS, API_EXTENSIONS, CATEGORIES } = require('../../commons');

const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const validAccess = ['public', 'protected', 'private'];

module.exports = class Data {

	constructor(db) {
		this.db = new Pool(db);
		this.loadLanguages();
	}

	loadLanguages() {
		this.languages = LANGUAGES.itemListElement.map(item => item.item.name);
		this.languages.push('Web');
		this.languages.push('Other');
		this.languages.sort();
	}

	getLanguages() {
		return this.languages;
	}

	async getEcosystem() {
		return this.upgradeEcosystems(await this.getAll("ecosystem"));
	}

	async getNewestEcosystem(recent = 3) {
		return this.upgradeEcosystems(await this.getNewest("ecosystem", recent));
	}

	async getCollections() {
		return []; // ToDo
	}

	async getCatalogs() {
		return this.upgradeCatalogs(await this.getAll("catalogs"));
	}

	async getNewestData(recent = 3) {
		return this.upgradeCatalogs(await this.getNewest("catalogs", recent));
	}

	async getAll(table) {
		try {
			const sql = `
			SELECT *
			FROM ${table}
			ORDER BY title ASC
			`;
			const res = await this.db.query(sql);
			return res.rows;
		} catch (error) {
			console.error(error);
		}
		return [];

	}

	async getNewest(table, recent = 3) {
		try {
			const sql = `
			SELECT *
			FROM ${table}
			ORDER BY created DESC
			LIMIT ${recent}
			`;
			const res = await this.db.query(sql);
			return res.rows;
		} catch (error) {
			console.error(error);
		}
		return [];
	}

	async getCollection(id) {
		return null; // ToDo
	}

	async getCatalog(slug) {
		const catalog = await this.findOne("catalogs", "slug", slug);
		if (catalog) {
			return this.upgradeCatalog(catalog);
		}
		else {
			return null;
		}
	}

	async findOne(table, column, value, excludeColumns = ["email"]) {
		try {
			const sql = `
			SELECT *
			FROM ${table}
			WHERE ${column} = $1
			LIMIT 1
			`;
			const res = await this.db.query(sql, [value]);
			if (res.rows.length > 0) {
				return Utils.omit(res.rows[0], excludeColumns);
			}
		} catch(error) {
			console.error(error);
		}
		return null;
	}

	async insertFromObject(data, table, timestamps = true) {
		try {
			if (timestamps) {
				data.created = new Date();
				data.updated = new Date();
			}
			const values = Object.values(data);
			const columns = Object.keys(data).join(', ');
			const placeholders = Utils.range(1, values.length+1).map(i => '$' + i).join(', ');
			const sql = `
				INSERT INTO ${table} (${columns})
				VALUES (${placeholders})
				RETURNING *
			`;
			const res = await this.db.query(sql, values);
			return res.rows[0];
		} catch(error) {
			console.error(error);
			return null;
		}
	}
	
	async addEcosystem(url, title, summary, categories = [], language = null, email = null, extensions = [], apiExtensions = []) {
		url = await this.checkUrl(url);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		categories = this.checkCategories(categories);
		language = this.checkLanguage(language);
		email = this.checkEmail(email);
		extensions = this.checkExtensions(extensions);
		apiExtensions = this.checkApiExtensions(apiExtensions);
		await this.checkDuplicates("ecosystem", url);

		var data = {url, title, summary, categories, language, email, extensions, api_extensions: apiExtensions};
		const ecosystem = await this.insertFromObject(data, "ecosystem");
		if (ecosystem) {
			return this.upgradeEcosystem(ecosystem);
		}
		else {
			throw new Error("Adding to the ecosystem database failed. Please contact us for details.");
		}
	}

	async addCatalog(isApi, url, slug, title, summary, access = 'public', accessInfo = null, email = null) {
		if (typeof isApi !== 'boolean') {
			isApi = false;
		}

		access = this.checkAccess(access);
		accessInfo = this.checkAccessInfo(access, accessInfo);
		url = await this.checkUrl(url, access !== 'private');
		slug = this.checkSlug(slug);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		email = this.checkEmail(email);
		await this.checkDuplicates("catalogs", url, title);
		if (await this.getCatalog(slug)) {
			throw new Error("Another catalog with the given slug exists. Please choose a different slug.");
		}

		var data = {slug, url, title, summary, access, access_info: accessInfo, email, is_api: isApi};
		const catalog = await this.insertFromObject(data, "catalogs");
		if (catalog) {
			return this.upgradeCatalog(catalog);
		}
		else {
			throw new Error("Adding to the catalog database failed. Please contact us for details.");
		}
	}

	async checkDuplicates(table, url, title = null) {
		const res = await this.db.query(`SELECT * FROM ${table}`);
		let similar = res.rows.find(col => {
			if (url.toLowerCase().startsWith(col.url.toLowerCase())) {
				return true;
			}
			let urlDist = new Levenshtein(col.url, url);
			if(urlDist.distance < 2) {
				return true;
			}
			if (title) {
				let titleDist = new Levenshtein(col.title, title);
				if(titleDist.distance < 4) {
					return true;
				}
			}
			return false;
		});

		if (typeof similar !== 'undefined') {
			throw new Error("The given API or Catalogs has already been submitted or the title or URL is very similar to another one.");
		}
	}

	async checkUrl(url, checkCatalog = false) {
		try {
			require('url').parse(url);
		} catch (e) {
			throw new Error('URL is invalid');
		}

		if (!checkCatalog) {
			return url;
		}

		try {
			let catalog = await axios(url);
			if (Utils.isPlainObject(catalog.data) && typeof catalog.data.id === 'string' && typeof catalog.data.description === 'string' && Array.isArray(catalog.data.links)) {
				return url;
			}
			else {
				throw new Error("A catalog can't be found at the URL given.");
			}
		} catch (e) {
			throw new Error("The URL given returned an error. Is this a private Catalog or API?");
		}
	}

	checkSlug(slug) {
		let length = typeof slug === 'string' ? slug.length : 0;
		if (slug.length < 3) {
			throw new Error(`Slug must be at least 3 characters, is ${length} characters`);
		}
		else if (slug.length > 50) {
			throw new Error(`Slug must be no longer than 50 characters, is ${length} characters`);
		}
		else if (!slug.match(/^[a-z0-9-]+$/)) {
			throw new Error('Slug must only contain the following characters: a-z, 0-9, -');
		}
		return slug;
	}

	checkTitle(title) {
		let length = typeof title === 'string' ? title.length : 0;
		if (title.length < 3) {
			throw new Error(`Title must be at least 3 characters, is ${length} characters`);
		}
		else if (title.length > 50) {
			throw new Error(`Title must be no longer than 50 characters, is ${length} characters`);
		}
		return title;
	}

	checkAccess(access) {
		if (!validAccess.includes(access)) {
			throw new Error('Access must by one of `public`, `protected` or `private`');
		}
		return access;
	}

	checkAccessInfo(access, accessInfo) {
		if (access === 'public') {
			return null;
		}

		let length = typeof accessInfo === 'string' ? accessInfo.length : 0;
		if (length < 100) {
			throw new Error(`Access details must be at least 100 characters, is ${length} characters`);
		}
		else if (accessInfo.length > 1000) {
			throw new Error(`Access details must be no longer than 1000 characters, is ${length} characters`);
		}
		return accessInfo;
	}

	checkSummary(summary) {
		let length = typeof summary === 'string' ? summary.length : 0;
		if (length < 50) {
			throw new Error(`Summary must be at least 50 characters, is ${length} characters`);
		}
		else if (length > 300) {
			throw new Error(`Summary must be no longer than 300 characters, is ${length} characters`);
		}
		return summary;
	}

	checkLanguage(lang) {
		if (typeof lang !== 'string' || lang.length === 0) {
			return null;
		}
		if (!this.languages.includes(lang)) {
			throw new Error('Programming Language "' + lang + '" is invalid');
		}
		return lang;
	}

	checkCategories(categories) {
		if (!Array.isArray(categories) || categories.length == 0) {
			throw new Error(`At least one category is required`);
		}
		let invalidCategory = categories.find(cat => !CATEGORIES.includes(cat));
		if (invalidCategory) {
			throw new Error(`Category '${invalidCategory}" is invalid`);
		}
		return categories;
	}

	checkEmail(email) {
		if (typeof email !== 'string' || email.length === 0) {
			return null;
		}
		if (!email.match(emailRegExp)) {
			throw new Error('Email is invalid');
		}
		return email;
	}

	checkExtensions(ext) {
		return this._checkExtensions(ext, false);
	}

	checkApiExtensions(ext) {
		return this._checkExtensions(ext, true);
	}

	_checkExtensions(extensions, api = false) {
		if(!Array.isArray(extensions)) {
			return [];
		}
		const allExtensions = Object.keys(api ? API_EXTENSIONS : EXTENSIONS);
		let invalidExtension = extensions.find(e => !allExtensions.includes(e));
		if (invalidExtension) {
			const label = api ? "API Extension" : "Extension";
			throw new Error(`${label} '${invalidExtension}' is invalid`);
		}
		return extensions;
	}

	upgradeEcosystem(tool) {
		// api_extensions => apiExtensions
		tool.apiExtensions = tool.api_extensions;
		delete tool.api_extensions;
		// Remove email
		delete tool.email;
		return tool;
	}
	
	upgradeEcosystems(tools) {
		return tools.map(this.upgradeEcosystem);
	}
	
	upgradeCatalog(catalog) {
		// Keep legacy "isPrivate" flag for external APIs
		catalog.isPrivate = Boolean(catalog.access !== "public");
		// is_api => isApi
		catalog.isApi = catalog.is_api;
		delete catalog.is_api;
		// access_info => accessInfo
		catalog.accessInfo = catalog.access_info;
		delete catalog.access_info;
		// Remove email
		delete catalog.email;
		return catalog;
	}
	
	upgradeCatalogs(catalogs) {
		return catalogs.map(this.upgradeCatalog);
	}

}