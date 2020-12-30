# STAC Index Server

## Project setup
```
npm install
```

### Deploy PostgreSQL 13+ database

See [database/create.sql](../database/create.sql) for the SQL schema.

### Configure

Adapt [commons.js](../commons.js) and [config.js](src/config.js) to suite your environment.

### Start server for development

```
npm run dev
```

### Start and stop server for production
```
npm run up
npm run down
```
