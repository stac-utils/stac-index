TRUNCATE TABLE collection_extensions CASCADE;
TRUNCATE TABLE collection_keywords CASCADE;
TRUNCATE TABLE collection_extensions CASCADE;
TRUNCATE TABLE collections CASCADE;
TRUNCATE TABLE item_extensions CASCADE;
TRUNCATE TABLE items CASCADE;
TRUNCATE TABLE keywords CASCADE;
TRUNCATE TABLE licenses CASCADE;
TRUNCATE TABLE queue CASCADE;
TRUNCATE TABLE stac_extensions CASCADE;
TRUNCATE TABLE stac_versions CASCADE;

SELECT setval('public.collections_id_seq', 1, true);
SELECT setval('public.items_id_seq', 1, true);
SELECT setval('public.keywords_id_seq', 1, true);
SELECT setval('public.licenses_id_seq', 1, true);
SELECT setval('public.stac_extensions_id_seq', 1, true);
SELECT setval('public.stac_versions_id_seq', 1, true);