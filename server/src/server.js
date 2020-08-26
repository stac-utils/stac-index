const restify = require('restify');
const fse = require('fs-extra');
const Utils = require('lodash');
const Data = require('./data');
const Config = require('./config');

class Server extends Config {

	constructor() {
		super();

		console.info('Initializing STAC Index Server...');

		this.http_server = null;
		this.https_server = null;

		this.afterServerStartListener = [];
		this.data = new Data('storage/');

		this.startServer();
	}

	addAfterServerStartListener(callback) {
		this.afterServerStartListener.push(callback);
	}

	async afterServerStart() {
		console.info('Server is expected to be exposed at %s', this.serverUrl);
		for(var listener of this.afterServerStartListener) {
			await listener(this);
		}
	}

	isHttpsEnabled() {
		return Boolean(this.ssl && this.ssl.port > 0 && typeof this.ssl.key === 'string' && typeof this.ssl.certificate === 'string');
	}

	async initHttpServer() {
		this.http_server = restify.createServer(this.serverOptions);
		this.initServer(this.http_server);
		return new Promise((resolve) => {
			this.http_server.listen(this.port, () => {
				this.serverUrl = "http://" + this.hostname + (this.exposedPort !== 80 ? ":" + this.exposedPort : "") + this.exposedPath;
				console.info('HTTP-Server listening at %s', "http://" + this.hostname + (this.port !== 80 ? ":" + this.port : ""));
				resolve();
			});
		});
	}

	async initHttpsServer() {
		if (this.isHttpsEnabled()) {
			var https_options = Object.assign({}, this.serverOptions, {
				key: fse.readFileSync(this.serverContext.ssl.key),
				certificate: fse.readFileSync(this.serverContext.ssl.certificate)
			});
			this.https_server = restify.createServer(https_options);
			this.initServer(this.https_server);
			return new Promise((resolve) => {
				if (this.isHttpsEnabled()) {
					this.https_server.listen(this.ssl.port, () => {
						this.serverUrl = "https://" + this.hostname + ":" + (this.ssl.exposedPort !== 443 ? ":" + this.ssl.exposedPort : "") + this.exposedPath;
						console.info('HTTPS-Server listening at %s', "https://" + this.hostname + ":" + this.ssl.port);
						resolve();
					});
				}
				else {
					console.warn('HTTPS not enabled.');
					resolve();
				}
			});
		}
		else {
			return Promise.resolve();
		}
	}

	errorHandler(req, res, e, next) {
		if (this.debug) {
			if (e.originalError) {
				console.error(e.originalError);
			}
			else {
				console.error(e);
			}
		}
		return next();
	}

	async startServer() {
		try {
			await this.initHttpServer();
			await this.initHttpsServer();
			await this.afterServerStart();
		} catch (e) {
			console.error('Server not started due to the following error: ');
			console.error(e);
			process.exit(1);
		}

	}

	injectCorsHeader(req, res, next) {
		if (!req.headers['origin']) {
			return next();
		}

		res.setHeader('access-control-allow-origin', req.headers['origin']);
		res.setHeader('access-control-expose-headers', this.corsExposeHeaders);
		return next();
	}

	preflight(req, res, next) {
		if (req.method !== 'OPTIONS') {
			return next();
		}

		res.once('header', () => {
			res.header('access-control-allow-origin', req.headers['origin']);
			res.header('access-control-expose-headers', this.corsExposeHeaders);
			res.header('access-control-allow-methods', 'OPTIONS, GET, POST, PATCH, PUT, DELETE');
			res.header('access-control-allow-headers', 'Content-Type');
		});

		res.send(204);
		// Don't call next, this ends execution, nothing more to send.
	}

	initServer(server) {
		server.on('restifyError', this.errorHandler.bind(this));
		server.pre(this.preflight.bind(this));
		server.use(restify.plugins.queryParser());
		server.use(restify.plugins.bodyParser());
		server.use(this.injectCorsHeader.bind(this));

		server.get('/', this.root.bind(this));
		server.post('/add', this.add.bind(this));
		server.get('/ecosystem', this.ecosystem.bind(this));
		server.get('/categories', this.categories.bind(this));
		server.get('/languages', this.languages.bind(this));
		server.get('/apis', this.apis.bind(this));
		server.get('/collections', this.collections.bind(this));
		server.get('/collections/*', this.collectionById.bind(this));
	}

	root(req, res, next) {
		res.send(200, {
			stac_version: "0.9.0",
			id:"stac-index",
			description: "Root catalog of STAC Index.",
			links:[
				{
					rel: "data",
					href: this.serverUrl + "/collections",
					type: "application/json",
					title: "Collections"
				}
			]
		});
		return next();
	}

	async add(req, res, next) {
		if (!Utils.isPlainObject(req.body)) {
			res.send(400, "No data given");
			return next();
		}
		switch(req.body.type) {
			case 'api':
			case 'catalog':
				try {
					let catalog = await this.data.addCatalog(req.body.type === 'api', req.body.url, req.body.slug, req.body.title, req.body.summary, req.body.access, req.body.email);
					res.send(200, catalog);
					return next();
				} catch (e) {
					res.send(400, e.message);
					return next();
				}
			case 'ecosystem':
				try {
					let eco = await this.data.addEcosystem(req.body.url, req.body.title, req.body.summary, req.body.categories, req.body.language, req.body.email);
					res.send(200, eco);
					return next();
				} catch (e) {
					res.send(400, e.message);
					return next();
				}
		}
		res.send(400, "Invalid type specified.");
		return next();
	}

	async ecosystem(req, res, next) {
		res.send(await this.data.getEcosystem());
		return next();
	}

	async apis(req, res, next) {
		res.send(await this.data.getApis());
		return next();
	}

	async collections(req, res, next) {
		res.send(await this.data.getCollections());
		return next();
	}

	async collectionById(req, res, next) {
		var slug = req.params['*'];
		res.send(await this.data.getCollection(slug));
		return next();
	}

	languages(req, res, next) {
		res.send(this.data.getLanguages());
		return next();
	}

	categories(req, res, next) {
		res.send(this.data.getCategories());
		return next();
	}

};

global.server = new Server();