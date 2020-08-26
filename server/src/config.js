module.exports = class Config {
	constructor() {
		this.debug = true;
		this.hostname = "localhost";
		this.exposedPath = "";
		this.port = 9999;
		this.exposedPort = 9999;
		this.ssl = {
			port: 443,
			exposedPort: 443,
			key: null,
			certificate: null
		};
		this.serverOptions = {
			ignoreTrailingSlash: true
		};
		this.corsExposeHeaders = 'Location';
	}
}