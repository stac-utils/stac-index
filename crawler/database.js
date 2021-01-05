module.exports = class Database {

	constructor(pool, logger) {
		this.pool = pool;
		this.db = null;
		this.logger = logger;
	}

	async connect() {
		this.db = await this.pool.connect();
	}

	async query(sql, values = []) {
		try {
			return await this.db.query(sql, values);
		} catch (error) {
			this.logger.error("Error in the following query:");
			this.logger.error(sql);
			if (values.length > 0) {
				this.logger.error("Values given:");
				this.logger.error(values);
			}
			throw error;
		}
	}

	release() {
		this.db.release();
	}
}