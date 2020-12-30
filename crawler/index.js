
const { Pool } = require('pg');
const axios = require('axios');
const Utils = require('lodash');
const { DEV, DATABASE } = require('../commons');

console.log("START");
const db = new Pool(DATABASE);
run()
    .then(() => console.log("FINISHED"))
    .catch(error => console.error(error));

async function run() {
    try {
        const sql = `SELECT * FROM catalogs`;
        const res = await this.db.query(sql, []);
        if (res.rows.length > 0) {
            return res.rows;
        }
        // TODO
    } catch(error) {
        if (DEV) {
            console.log(error);
        }
    }
}

async function insertFromObject(data, table) {
    try {
        const values = Object.values(data);
        const columns = Object.keys(data).join(', ');
        const placeholders = Utils.range(1, values.length+1).map(i => '$' + i).join(', ');
        const sql = `
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders})
            RETURNING *
        `;
        const res = await db.query(sql, values);
        return res.rows[0];
    } catch(error) {
        console.error(error);
        return null;
    }
}