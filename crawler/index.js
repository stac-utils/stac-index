
const pg = require('pg');
const pgr = require("pg-range")
const axios = require('axios');
const Utils = require('lodash');
const { DATABASE } = require('../commons');
const logger = require('./logger');

// Add range support to node pg driver
pgr.install(pg);
// Create new pg connection pool
const db = new pg.Pool(DATABASE);

console.info("START");

/*
 TODOs:
 - Fix all "Todos" 
 - parallelize
 - validate fields
    - license is often > 50 chars
    - keywords is sometimes too long (increased from 50 to 100 chars)
    - rarely collection ids are > 100 chars
 - support for relative links
 - put keywords, license, stac_extensions into separate tables
 */

run().catch(error => logger.error(error));

async function run() {
    // Clean up queue daily (and now)
    await cleanQueue();
    setInterval(cleanQueue, 24*60*60*1000);

    // Add new catalogs to queue every hour (and now)
    await insertCatalogsToQueue();
    setInterval(insertCatalogsToQueue, 60*60*1000);
    
    return await crawl();
}

async function crawl() {
    do {
        // New entries: accessed = NULL, checks = 0, crawled = NULL
        // New entries with failures: accessed = time, checks = >= 1, crawled = NULL
        // Crawled entries: accessed = time, checks = 0, crawled = time
        const sql = `
            SELECT *
            FROM queue
            WHERE ( 
                accessed IS NULL   -- New entries (may have failed one time)
                OR (accessed < (NOW() - INTERVAL '1 WEEK') AND checks BETWEEN 1 AND 4)   -- On failue, try again after a week, stop after 4 weeks
                OR (crawled < (NOW() - INTERVAL '1 YEAR') OR accessed < (NOW() - INTERVAL '1 YEAR'))   -- Recrawl every year
                ) AND type != 'item' -- ODO: Ignore items for now
            ORDER BY 
                checks ASC, -- Prio for new entries
                RANDOM() -- Don't pressure one server too much, choose random entry
            LIMIT 100
        `;
        const res = await db.query(sql, []);
        if (res.rows.length === 0) {
            // If nothing more was available to crawl, make a break for an hour
            setTimeout(crawl, 60*60*1000);
            logger.log("Nothing to crawl, trying again in an hour...");
            return;
        }

        // Index entries from queue
        for(let q of res.rows) {
            try {
                logger.log("Crawling: " + q.url);
                // set last access time and increase check number
                const sql = `
                    UPDATE queue
                    SET accessed = NOW(), checks = checks + 1
                    WHERE url = $1
                `;
                await db.query(sql, [q.url]);
            
                if (await parseUrl(q)) {
                    // Set crawl time
                    const sql = `
                        UPDATE queue
                        SET crawled = NOW(), checks = 0
                        WHERE url = $1
                    `;
                    await db.query(sql, [q.url]);
                }
            } catch (error) {
                logger.error(error);
            }
        }
    } while(true);
}

async function parseUrl(q) {
    let data = await request(q.url);
    if (!Utils.isPlainObject(data)) {
        logger.log("Invalid response");
        return false;
    }
    let type = detectStacType(data);
    if (type === null) {
        logger.log("Response is not STAC");
        return false;
    }
    let links = linksByRel(data.links);
    await addLinksToQueue(links, q.catalog, type);
    switch(type) {
        case 'item':
            return await addItem(data, q);
        case 'catalog':
            return true;
        case 'collection':
            return await addCollection(data, q);
        case 'itemcollection':
            return await addLinksFromResources(q, data, 'features', 'item');
        case 'collections':
            return await addLinksFromResources(q, data, 'collections', 'collection');
    }
    return false;
}

async function addLinksFromResources(q, data, key, type) {
    for(let obj of data[key]) {
        let links = linksByRel(obj.links);
        let url;
        if (links.self && links.self.length > 0) {
            url = links.self[0].href;
        }
        else if (typeof obj.id === 'string') {
            url = addPathElement(q.url, encodeURIComponent(obj.id));
        }
        await insertToQueue(url, type, q.catalog);
    }
    return true;
}

async function addItem(source, q) {
    let data = {
        url: q.url,
        catalog: q.catalog,
        stac_version: source.stac_version || '',
        stac_extensions: source.stac_extensions || [],
        collection: null // TODO
    };
    return upsertFromObject(data, 'items', 'url');
}

async function addCollection(source, q) {
    let data = {
        url: q.url,
        catalog: q.catalog,
        stac_version: source.stac_version || '',
        stac_extensions: source.stac_extensions || [],
        stac_id: source.id || '',
        title: source.title || null,
        description: source.description || '',
        keywords: source.keywords || [],
        license: typeof source.license === 'string' && source.license.length <= 50 ? source.license : '',
        spatial_extent: null, // TODO
        temporal_extent: null, // TODO: pgr.Range(..., ...)
        source,
        doi: source['sci:doi'] || null,
        version: source.version || null,
        deprecated: source.deprecated || false
    };
    return upsertFromObject(data, 'collections', 'url');
}

function addPathElement(baseUrl, component) {
    return baseUrl.replace(/\/+$/, '') + '/' + component
}

function detectStacType(data) {
    if (!Utils.isPlainObject(data)) {
        return null;
    }
    let type = null;
    let hasVersion = (typeof data.stac_version === 'string');
    if (typeof data.type !== 'undefined') {
        if (data.type === 'Feature' && hasVersion) {
            type = 'item';
        }
        else if (data.type === 'FeatureCollection') {
            type = 'itemcollection';
        }
    }
    else if (hasVersion) {
        if (typeof data.extent !== 'undefined' || typeof data.license !== 'undefined') {
            type = 'collection';

        }
        else {
            type = 'catalog';
        }
    }
    else if (Array.isArray(data.collections)) {
        type = 'collections';
    }
    return type;
}

function linksByRel(links) {
    let rels = {};
    for(let link of links) {
        if (typeof link.type === 'string' && link.type !== 'application/json') {
            continue; // Ignore all links that are clearly non-JSON 
        }
        if (typeof link.method === 'string' && link.method.toLowerCase() !== 'get') {
            continue; // Ignore all links that are clearly non-GET method // TODO: Add POST support later?
        }
        if (typeof link.rel === 'string') {
            if (!Array.isArray(rels[link.rel])) {
                rels[link.rel] = [];
            }
            rels[link.rel].push(link);
        }
    }
    return rels;
}

async function addLinksToQueue(links, catalog, type) {
    // parent/root: ignore for now, I can't detect whether it's part actually part of the catalog (id)
    // item
    if (Array.isArray(links.item)) {
        for(let link of links.item) {
            await insertToQueue(link.href, 'item', catalog);
        }
    }
    // child
    if (Array.isArray(links.child)) {
        for(let link of links.child) {
            await insertToQueue(link.href, 'catalog', catalog);
        }
    }
    // items
    if (Array.isArray(links.items) && links.items.length > 0) {
        await insertToQueue(links.items[0].href, 'api', catalog);
    }
    // data
    if (Array.isArray(links.data) && links.data.length > 0) {
        await insertToQueue(links.data[0].href, 'api', catalog);
    }
    // collection
    if (Array.isArray(links.collection) && links.collection.length > 0) {
        await insertToQueue(links.collection[0].href, 'collection', catalog);
    }
    // next
    if (Array.isArray(links.next) && links.next.length > 0) {
        await insertToQueue(links.next[0].href, type, catalog);
    }
}

async function request(url) {
    try {
        let response = await axios({
            url: url,
            method: 'get',
            headers: {}, // request http headers
            params: {}, // request query parameters
            data: {}, // request body
            timeout: 2000, // request timeout
            responseType: 'json',
            responseEncoding: 'utf8',
            maxRedirects: 5,
            decompress: true
        });
        return response.data;
    } catch(error) {
        logger.log(error.message);
        return null;
    }
}

async function insertToQueue(url, type, catalog) {
    if (typeof url === 'string' && catalog > 0) {
        try {
            const sql = `
                INSERT INTO queue (url, type, catalog)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
            `;
            await db.query(sql, [url, type, catalog]);
        } catch(error) {
            logger.error(error);
        }
    }
}

async function insertCatalogsToQueue() {
    logger.log("Insert catalogs into queue (if not exists)");
    try {
        const sql = `
            INSERT INTO queue (url, catalog, type)
            SELECT url, id, 'catalog' AS type FROM catalogs
            ON CONFLICT DO NOTHING
        `;
        await db.query(sql);
    } catch(error) {
        logger.error(error);
    }
}

async function cleanQueue() {
    logger.log("Clean up queue");
    try {
        await db.query('DELETE FROM queue WHERE checks > 4');
    } catch(error) {
        logger.error(error);
    }
}

async function upsertFromObject(data, table, conflict) {
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = Utils.range(1, values.length+1).map(i => '$' + i);
        const update = Object.keys(data).map((v, k) => `${v} = ${placeholders[k]}`);

        const sql = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (${conflict}) DO
                UPDATE SET ${update.join(', ')}
            RETURNING *
        `;
        const res = await db.query(sql, values);
        return (res.rows.length > 0);
    } catch(error) {
        logger.error(error);
        return false;
    }
}