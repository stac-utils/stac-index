const API_EXTENSIONS = {
	"features": "OGC API - Features",
	"features-transactions": "OGC API - Features - Transactions",
	"features-versioning": "OGC API - Features - Versioning",
	"item-search": "Item Search",
	"item-search-sort": "Item Search - Sort",
	"item-search-fields": "Item Search - Fields",
	"item-search-query": "Item Search - Query (deprecated)",
	"item-search-filter": "Item Search - Filter",
	"item-search-context": "Item Search - Context"
};
const EXTENSIONS = {
	"checksum": "Checksum (deprecated)",
	"collection-assets": "Collection Assets",
	"datacube": "Data Cube",
	"eo": "Electro-Optical",
	"file": "File",
	"item-assets": "Item Asset Definition",
	"label": "Label",
	"pointcloud": "Point Cloud",
	"processing": "Processing",
	"projection": "Projection",
	"raster": "Raster",
	"sar": "SAR",
	"sat": "Satellite",
	"scientific": "Scientific",
	"single-file-stac": "Single File STAC",
	"tiled-asstes": "Tiled Assets",
	"timestamps": "Timestamps",
	"version": "Versioning Indicators",
	"view": "View Geometry"
};
const CATEGORIES = [
	'API',
	'CLI',
	'Client',
	'Data Creation',
	'Data Processing',
	'Other',
	'Server',
	'Static',
	'Validation',
	'Visualization'
];

const LINK_REGEXP = /^(.*)\[([^\]]+)\]\((https?:\/\/[^\)<>]+)\)(.*)$/;

const DEV = false;
const HTTP_HOST = DEV ? 'localhost' : 'stacindex.org';
const HTTP_INT_PORT = DEV ? 80 : 9999;
const HTTP_PORT = DEV ? 80 : 80;
const HTTP_PATH = DEV ? '' : '/api';
const HTTPS = !DEV;

const DATABASE = {
	user: 'postgres',
	host: 'localhost',
	database: 'stacindex',
	password: '',
	port: 5432
};

module.exports = {
	LINK_REGEXP,
	EXTENSIONS,
	API_EXTENSIONS,
	CATEGORIES,
	DEV,
	HTTP_HOST,
	HTTP_PORT,
	HTTP_INT_PORT,
	HTTP_PATH,
	HTTPS,
	DATABASE
};