const Manager = require('./manager');

/*
 TODOs:
 - Fix all "Todos" 
 - parallelize
 - fix: validate fields better (e.g. stac_version with regexp, remove https://doi.org/ prefix from DOIs)
 - fix: Temporal extents with start = end give {empty} in db, e.g. https://portal.opentopography.org/stac/CA17_Guns_catalog.json
 - remove html from description (html-to-text)
 - fix: remove the superfluous `ON CONFLICT (...) UPDATE` statements 
   with something more meaningful: https://stackoverflow.com/a/42217872
   For example put multiple queries into a pl/pqsql script / function
 - Implement summary handling 
   - create tables dynamically
   - create summaries from items
 - Handle queue entries based on HTTP code
   - Retry on 400, 404, 500, but remove for 401/403 (authentication required)
 */

 const manager = new Manager();
 manager
 	.run()
 	.catch(error => console.error(error));