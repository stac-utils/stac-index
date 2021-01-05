--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 13.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: catalogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalogs (
    id integer NOT NULL,
    url text NOT NULL,
    slug character varying(50) NOT NULL,
    title character varying(50) NOT NULL,
    summary text NOT NULL,
    email character varying(255),
    access character varying(10) NOT NULL,
    access_info text,
    is_api boolean NOT NULL,
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL
);


ALTER TABLE public.catalogs OWNER TO postgres;

--
-- Name: catalogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.catalogs_id_seq OWNER TO postgres;

--
-- Name: catalogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogs_id_seq OWNED BY public.catalogs.id;


--
-- Name: collection_extensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_extensions (
    collection integer NOT NULL,
    extension integer NOT NULL
);


ALTER TABLE public.collection_extensions OWNER TO postgres;

--
-- Name: collection_keywords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_keywords (
    collection integer NOT NULL,
    keyword integer NOT NULL
);


ALTER TABLE public.collection_keywords OWNER TO postgres;

--
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    url text NOT NULL,
    catalog integer NOT NULL,
    stac_version integer,
    stac_id character varying(150),
    title text,
    description text,
    license integer,
    spatial_extent geometry[] NOT NULL,
    temporal_extent tstzrange[] NOT NULL,
    source json NOT NULL,
    doi character varying(150),
    deprecated boolean DEFAULT false NOT NULL
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collections_id_seq OWNER TO postgres;

--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: ecosystem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecosystem (
    id integer NOT NULL,
    url text NOT NULL,
    title character varying(50) NOT NULL,
    summary text NOT NULL,
    categories character varying(50)[] NOT NULL,
    email character varying(255),
    extensions character varying(50)[] NOT NULL,
    api_extensions character varying(50)[] NOT NULL,
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL,
    language character varying(50)
);


ALTER TABLE public.ecosystem OWNER TO postgres;

--
-- Name: ecosystem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ecosystem_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ecosystem_id_seq OWNER TO postgres;

--
-- Name: ecosystem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecosystem_id_seq OWNED BY public.ecosystem.id;


--
-- Name: item_extensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_extensions (
    item bigint NOT NULL,
    extension integer NOT NULL
);


ALTER TABLE public.item_extensions OWNER TO postgres;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id bigint NOT NULL,
    url text NOT NULL,
    catalog integer NOT NULL,
    stac_version integer NOT NULL,
    collection integer
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: keywords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.keywords (
    id integer NOT NULL,
    keyword text NOT NULL
);


ALTER TABLE public.keywords OWNER TO postgres;

--
-- Name: keywords_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.keywords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.keywords_id_seq OWNER TO postgres;

--
-- Name: keywords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.keywords_id_seq OWNED BY public.keywords.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.licenses (
    id integer NOT NULL,
    license character varying(50) NOT NULL
);


ALTER TABLE public.licenses OWNER TO postgres;

--
-- Name: licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.licenses_id_seq OWNER TO postgres;

--
-- Name: licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.licenses_id_seq OWNED BY public.licenses.id;


--
-- Name: queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue (
    url text NOT NULL,
    type character varying(15) NOT NULL,
    accessed timestamp without time zone,
    checks integer DEFAULT 0 NOT NULL,
    catalog integer NOT NULL,
    crawled timestamp without time zone
);


ALTER TABLE public.queue OWNER TO postgres;

--
-- Name: stac_extensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stac_extensions (
    id integer NOT NULL,
    extension text NOT NULL
);


ALTER TABLE public.stac_extensions OWNER TO postgres;

--
-- Name: stac_extensions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stac_extensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stac_extensions_id_seq OWNER TO postgres;

--
-- Name: stac_extensions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stac_extensions_id_seq OWNED BY public.stac_extensions.id;


--
-- Name: stac_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stac_versions (
    id integer NOT NULL,
    version character varying(20) NOT NULL
);


ALTER TABLE public.stac_versions OWNER TO postgres;

--
-- Name: stac_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stac_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stac_versions_id_seq OWNER TO postgres;

--
-- Name: stac_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stac_versions_id_seq OWNED BY public.stac_versions.id;


--
-- Name: catalogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs ALTER COLUMN id SET DEFAULT nextval('public.catalogs_id_seq'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: ecosystem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem ALTER COLUMN id SET DEFAULT nextval('public.ecosystem_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: keywords id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords ALTER COLUMN id SET DEFAULT nextval('public.keywords_id_seq'::regclass);


--
-- Name: licenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenses ALTER COLUMN id SET DEFAULT nextval('public.licenses_id_seq'::regclass);


--
-- Name: stac_extensions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_extensions ALTER COLUMN id SET DEFAULT nextval('public.stac_extensions_id_seq'::regclass);


--
-- Name: stac_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_versions ALTER COLUMN id SET DEFAULT nextval('public.stac_versions_id_seq'::regclass);


--
-- Name: catalogs catalogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);


--
-- Name: catalogs catalogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_slug_key UNIQUE (slug);


--
-- Name: catalogs catalogs_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_url_key UNIQUE (url);


--
-- Name: collection_extensions collection_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_extensions
    ADD CONSTRAINT collection_extensions_pkey PRIMARY KEY (collection, extension);


--
-- Name: collection_keywords collection_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_keywords
    ADD CONSTRAINT collection_keywords_pkey PRIMARY KEY (collection, keyword);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: collections collections_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_url_key UNIQUE (url);


--
-- Name: ecosystem ecosystem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_pkey PRIMARY KEY (id);


--
-- Name: ecosystem ecosystem_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_url_key UNIQUE (url);


--
-- Name: item_extensions item_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_extensions
    ADD CONSTRAINT item_extensions_pkey PRIMARY KEY (item, extension);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_url_key UNIQUE (url);


--
-- Name: keywords keywords_keyword_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_keyword_key UNIQUE (keyword);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_license_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key UNIQUE (license);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (url);


--
-- Name: queue queue_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_url_key UNIQUE (url);


--
-- Name: stac_extensions stac_extensions_extension_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_extensions
    ADD CONSTRAINT stac_extensions_extension_key UNIQUE (extension);


--
-- Name: stac_extensions stac_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_extensions
    ADD CONSTRAINT stac_extensions_pkey PRIMARY KEY (id);


--
-- Name: stac_versions stac_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_versions
    ADD CONSTRAINT stac_versions_pkey PRIMARY KEY (id);


--
-- Name: stac_versions stac_versions_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stac_versions
    ADD CONSTRAINT stac_versions_version_key UNIQUE (version);


--
-- Name: accessed_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX accessed_index ON public.queue USING btree (accessed DESC);


--
-- Name: collection_extensions collection_extensions_collection_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_extensions
    ADD CONSTRAINT collection_extensions_collection_fkey FOREIGN KEY (collection) REFERENCES public.collections(id) ON DELETE CASCADE NOT VALID;


--
-- Name: collection_extensions collection_extensions_extension_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_extensions
    ADD CONSTRAINT collection_extensions_extension_fkey FOREIGN KEY (extension) REFERENCES public.stac_extensions(id) ON DELETE CASCADE NOT VALID;


--
-- Name: collection_keywords collection_keywords_collection_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_keywords
    ADD CONSTRAINT collection_keywords_collection_fkey FOREIGN KEY (collection) REFERENCES public.collections(id) ON DELETE CASCADE NOT VALID;


--
-- Name: collection_keywords collection_keywords_keyword_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_keywords
    ADD CONSTRAINT collection_keywords_keyword_fkey FOREIGN KEY (keyword) REFERENCES public.keywords(id) ON DELETE CASCADE NOT VALID;


--
-- Name: collections collections_catalog_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_catalog_fkey FOREIGN KEY (catalog) REFERENCES public.catalogs(id) ON DELETE CASCADE NOT VALID;


--
-- Name: item_extensions item_extensions_extension_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_extensions
    ADD CONSTRAINT item_extensions_extension_fkey FOREIGN KEY (extension) REFERENCES public.stac_extensions(id) ON DELETE CASCADE NOT VALID;


--
-- Name: item_extensions item_extensions_item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_extensions
    ADD CONSTRAINT item_extensions_item_fkey FOREIGN KEY (item) REFERENCES public.items(id) ON DELETE CASCADE NOT VALID;


--
-- Name: items items_catalog_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_catalog_fkey FOREIGN KEY (catalog) REFERENCES public.catalogs(id) ON DELETE CASCADE NOT VALID;


--
-- Name: items items_collection_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_collection_fkey FOREIGN KEY (collection) REFERENCES public.collections(id) ON DELETE SET NULL NOT VALID;


--
-- Name: collections licenses_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT licenses_fkey FOREIGN KEY (license) REFERENCES public.licenses(id) ON DELETE SET NULL NOT VALID;


--
-- Name: queue queue_catalog_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_catalog_fkey FOREIGN KEY (catalog) REFERENCES public.catalogs(id) ON DELETE CASCADE;


--
-- Name: collections stac_versions_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT stac_versions_fkey FOREIGN KEY (stac_version) REFERENCES public.stac_versions(id) ON DELETE CASCADE NOT VALID;


--
-- Name: items stac_versions_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT stac_versions_fkey FOREIGN KEY (stac_version) REFERENCES public.stac_versions(id) NOT VALID;


--
-- PostgreSQL database dump complete
--

