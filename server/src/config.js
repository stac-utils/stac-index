module.exports = class Config {
	constructor() {
		this.debug = true;
		this.hostname = "localhost";
		this.port = 80;
		this.ssl = {
			port: 443,
			key: null,
			certificate: null
		};
		this.serverOptions = {
			ignoreTrailingSlash: true
		};
		this.corsExposeHeaders = 'Location';
	}
}