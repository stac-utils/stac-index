const LANGUAGES = require('list-of-programming-languages');
const Datastore = require('nedb');
const axios = require('axios');
const Utils = require('lodash');
const Levenshtein = require('levenshtein');
const { EXTENSIONS, API_EXTENSIONS, CATEGORIES } = require('../../commons');

const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const validAccess = ['public', 'protected', 'private'];

function upgradeEcosystem(tools) {
	// Add extensions and apiExtensions with default values as they are missing for some older entries
	return tools.map(tool => Object.assign({extensions: [], apiExtensions: []}, tool));
}

function upgradeCatalog(catalog) {
	// Keep legacy "isPrivate" flag for external APIs
	catalog.isPrivate = Boolean(catalog.access !== "public");
	return catalog;
}

function upgradeCatalogs(catalogs) {
	return catalogs.map(catalog => upgradeCatalog(catalog));
}

module.exports = class Data {

	constructor(storagePath) {
		this.ecosystem = this.load('ecosystem', storagePath);
		this.catalogs = this.load('catalogs', storagePath);
		this.collections = this.load('collections', storagePath);
		this.loadLanguages();
	}


	load(name, folder) {
		let db = new Datastore({
			filename: folder + name + '.db',
			autoload: true,
			timestampData: true,
			compareStrings: (a, b) => {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			}
		});
		db.persistence.setAutocompactionInterval(24 * 60 * 60 * 1000); // Once every day
		return db;
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
		return new Promise((resolve, reject) => {
			this.ecosystem.find({}, { email: 0 }).sort({ title: 1 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(upgradeEcosystem(data));
				}
			});
		});
	}

	async getNewestEcosystem(recent = 3) {
		return new Promise((resolve, reject) => {
			this.ecosystem.find({}, { email: 0 }).sort({ createdAt: -1 }).limit(recent).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(upgradeEcosystem(data));
				}
			});
		});
	}

	async getCollections() {
		return new Promise((resolve, reject) => {
			this.collections.find({}, { email: 0 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}

	async getCatalogs() {
		return new Promise((resolve, reject) => {
			this.catalogs.find({}, { email: 0 }).sort({ title: 1 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(upgradeCatalogs(data));
				}
			});
		});
	}

	async getNewestData(recent = 3) {
		return new Promise((resolve, reject) => {
			this.catalogs.find({}, { email: 0 }).sort({ createdAt: -1 }).limit(recent).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(upgradeCatalogs(data));
				}
			});
		});
	}

	async getCollection(id) {
		return new Promise((resolve, reject) => {
			this.collections.findOne({id}, { email: 0 }, function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}

	async getCatalog(slug) {
		return new Promise((resolve, reject) => {
			this.catalogs.findOne({slug}, { email: 0 }, function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(upgradeCatalog(data));
				}
			});
		});
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
		this.checkDuplicates(this.ecosystem, url);
		
		return new Promise((resolve, reject) => {
			var data = {url, title, summary, categories, language, email, extensions, apiExtensions};
			this.ecosystem.insert(data, (err, ecosystem) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(ecosystem);
				}
			});
		});
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
		await this.checkDuplicates(this.catalogs, url, title);
		if (await this.getCollection(slug)) {
			throw new Error("Another catalog with the given slug exists. Please choose a different slug.");
		}

		return new Promise((resolve, reject) => {
			var data = {isApi, slug, url, title, summary, access, accessInfo, email};
			this.catalogs.insert(data, (err, catalog) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(catalog);
				}
			});
		});
	}

	async checkDuplicates(db, url, title = null) {
		return new Promise((resolve, reject) => {
			db.find({}, function (err, data) {
				if (err) {
					return reject(err);
				}
				let similar = data.find(col => {
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
				if (similar) {
					reject(new Error("The given API or Catalogs has already been submitted or the title or URL is very similar to another one."));
				}
				else {
					resolve();
				}
			});
		});
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

}