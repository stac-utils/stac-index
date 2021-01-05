const { DEV } = require('../commons');

module.exports = class Logger {

	constructor(prefix = '') {
		this.prefix = prefix;
	}

	log(log) {
		if (DEV) {
			console.log(`${this.prefix}: ${log}`);
		}
	}

	warn(warn) {
		if (DEV) {
			if (warn instanceof Error) {
				console.error(`${this.prefix}: ${warn.message}`);
			}
			else {
				console.error(`${this.prefix}: ${warn}`);
			}
		}
	}

	error(error) {
		if (error instanceof Error) {
			console.error(`${this.prefix}:`, error);
		}
		else {
			console.error(`${this.prefix}: ${error}`);
		}
	}
};