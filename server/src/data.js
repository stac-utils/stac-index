const LANGUAGES = require('list-of-programming-languages');
const Datastore = require('nedb');

const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

module.exports = class Data {

	constructor(storagePath) {
		this.ecosystem = this.load('ecosystem', storagePath);
		this.catalogs = this.load('catalogs', storagePath);
		this.categories = [
			'API',
			'CLI',
			'Client',
			'Data Creation',
			'Data Processing',
			'Other',
			'Server',
			'Static',
			'Validation',
			'Visualization'
		];
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

	getCategories() {
		return this.categories;
	}

	async getEcosystem() {
		return new Promise((resolve, reject) => {
			this.ecosystem.find({}).sort({ title: 1 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}

	async getApis() {
		return new Promise((resolve, reject) => {
			this.catalogs.find({isApi: true}).sort({ title: 1 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});

	}

	async getCollections() {
		return new Promise((resolve, reject) => {
			this.catalogs.find({isApi: false}).sort({ title: 1 }).exec(function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}

	async getCollection(id) {
		return new Promise((resolve, reject) => {
			this.catalogs.findOne({_id: id}, function (err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	
	async addEcosystem(url, title, summary, categories = [], language = null, email = null) {
		url = await this.checkUrl(url);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		categories = this.checkCategories(categories);
		language = this.checkLanguage(language);
		email = this.checkEmail(email);
		
		return new Promise((resolve, reject) => {
			var data = {url, title, summary, categories, language, email};
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

	async addCatalog(isApi, url, title, summary, access = null, email = null) {
		if (typeof isApi !== 'boolean') {
			isApi = false;
		}

		access = this.checkAccess(access);
		let isPrivate = false;
		if (typeof access === 'string' && access.length > 0) {
			isPrivate = true;
		}

		url = await this.checkUrl(url, !isPrivate);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		email = this.checkEmail(email);

		return new Promise((resolve, reject) => {
			var data = {isApi, isPrivate, url, title, summary, access, email};
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

	async checkUrl(url, checkCatalog = false) {
		try {
			require('url').parse(url);
		} catch (e) {
			throw new Error('URL is invalid');
		}

		// ToDo: Check that URL is not in database yet

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

	checkTitle(title) {
		if (typeof title !== 'string') {
			throw new Error('Title is not a string');
		}
		else if (title.length < 3) {
			throw new Error('Title must be at least 3 characters');
		}
		else if (title.length > 50) {
			throw new Error('Title must be no longer than 50 characters');
		}
		return title;
	}

	checkAccess(access) {
		if (typeof access !== 'string') {
			return null;
		}
		else if (access.length < 100) {
			throw new Error('Access information must be at least 100 characters');
		}
		else if (access.length > 1000) {
			throw new Error('Access information must be no longer than 1000 characters');
		}
		return access;
	}

	checkSummary(summary) {
		if (typeof summary !== 'string') {
			throw new Error('Summary is not a string');
		}
		else if (summary.length < 50) {
			throw new Error('Summary must be at least 50 characters');
		}
		else if (summary.length > 500) {
			throw new Error('Summary must be no longer than 500 characters');
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
		if (!Array.isArray(categories)) {
			return [];
		}
		let invalidCategory = categories.find(cat => !this.categories.includes(cat));
		if (invalidCategory) {
			throw new Error('Category "' + invalidCategory + '" is invalid');
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

}