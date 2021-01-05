const Crawler = require('./crawler');
const Logger = require('./logger');
const { performance } = require('perf_hooks');

const { DATABASE } = require('../commons');
const pg = require('pg');
const pgr = require("pg-range");
const Database = require('./database');

module.exports = class CrawlerManager {

	constructor() {
		this.logger = new Logger();
		this.logger.log("SETTING UP ENV");

		// Add range support to node pg driver
		pgr.install(pg);

		this.crawlAllItems = false;
		this.parallel = 50;
		this.crawlTimeout = 2000; // 2 secs

		// Create connection pool
		const poolConfig = {
			max: this.parallel + 1,
			idleTimeoutMillis: this.crawlTimeout * this.parallel
		};
		this.pool = new pg.Pool(Object.assign(poolConfig, DATABASE));
	
		// Create new pg connection pool and connect
		this.db = new Database(this.pool, this.logger);
	}
	
	async run() {
		try {
			await this.db.connect();

			// Clean up queue daily (and now)
			await this.cleanQueue();
			setInterval(() => this.cleanQueue(), 24*60*60*1000);
		
			// Add new catalogs to queue every hour (and now)
			await this.insertCatalogsToQueue();
			setInterval(() => this.insertCatalogsToQueue(), 60*60*1000);

			this.logger.log("Start Crawling");
			return await this.crawl();
		} catch (error) {
			this.logger.error(error);
		}
	}

	async crawl() {
		let rowCount = 0;
		do {
			const t0 = performance.now();
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
--  				CASE -- Less prio for the large catalogs, TODO: don't hardcode...
--						WHEN url LIKE '%cmr.earthdata.nasa.gov%' THEN 1
--						WHEN url LIKE '%spacebel%' THEN 1
--						ELSE 0
--					END,
					CASE type -- Priority, i.e. highest priority for collections
						WHEN 'collection' THEN 10
						WHEN 'collections' THEN 20
						WHEN 'catalog' THEN 30
						WHEN 'itemcollection' THEN 30
						WHEN 'items' THEN 30
						WHEN 'item' THEN 50
						ELSE 100
					END,
					RANDOM() -- Don't pressure one server too much, choose random entries
				LIMIT ${this.parallel}
			`;
			const res = await this.db.query(sql);
			rowCount = res.rows.length;

			const promises = []; 
			for(let q of res.rows) {
				// Create new Crawler for a chunk of queue entries
				const crawler = new Crawler(this.pool, q, this.crawlAllItems, this.crawlTimeout);
				promises.push(crawler.crawl());
			}
			try {
				await Promise.all(promises);
			} catch (error) {
				this.logger.error(error);
			} finally {
				const t1 = performance.now();
				const delta = Math.round(t1 - t0) / 1000;
				this.logger.log(`Crawling ${rowCount} entries took ${delta} seconds.`);
			}

		} while(rowCount > 0);

		// If nothing more is available for crawling, make a break for an hour
		setTimeout(() => this.crawl(), 60*60*1000);
		this.logger.log("Nothing to crawl, trying again in an hour...");
	}

	async insertCatalogsToQueue() {
		try {
			this.logger.log("Insert new catalogs into queue");
			await this.db.query(`
				INSERT INTO queue (url, catalog, type)
				SELECT url, id, 'catalog' AS type FROM catalogs
				ON CONFLICT DO NOTHING
			`);
		} catch(error) {
			this.logger.error(error);
		}
	}
	
	async cleanQueue() {
		try {
			this.logger.log("Clean up queue");
			await this.db.query('DELETE FROM queue WHERE checks > 4');
		} catch(error) {
			this.logger.error(error);
		}
	}
}