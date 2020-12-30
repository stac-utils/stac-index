--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 13.1

-- Started on 2020-12-31 00:28:56

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 203 (class 1259 OID 16408)
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
-- TOC entry 202 (class 1259 OID 16406)
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
-- TOC entry 3048 (class 0 OID 0)
-- Dependencies: 202
-- Name: catalogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogs_id_seq OWNED BY public.catalogs.id;


--
-- TOC entry 207 (class 1259 OID 16455)
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    stac_version character varying(20) NOT NULL,
    stac_extensions character varying(50)[] NOT NULL,
    stac_id character varying(100) NOT NULL,
    title text,
    description text NOT NULL,
    keywords character varying(50)[] NOT NULL,
    license character varying(50) NOT NULL,
    spatial_extent polygon[] NOT NULL,
    temporal_extent tstzrange[] NOT NULL,
    source json NOT NULL,
    doi character varying(150),
    version character varying(50),
    deprecated boolean DEFAULT false NOT NULL
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- TOC entry 3049 (class 0 OID 0)
-- Dependencies: 207
-- Name: COLUMN collections.doi; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.collections.doi IS 'maps sci:doi';


--
-- TOC entry 206 (class 1259 OID 16453)
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
-- TOC entry 3050 (class 0 OID 0)
-- Dependencies: 206
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- TOC entry 201 (class 1259 OID 16397)
-- Name: ecosystem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecosystem (
    id integer NOT NULL,
    url text NOT NULL,
    title character varying(50) NOT NULL,
    summary text NOT NULL,
    categories character varying(50)[] NOT NULL,
    language character varying(50),
    email character varying(255),
    extensions character varying(50)[] NOT NULL,
    api_extensions character varying(50)[] NOT NULL,
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL
);


ALTER TABLE public.ecosystem OWNER TO postgres;

--
-- TOC entry 200 (class 1259 OID 16395)
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
-- TOC entry 3051 (class 0 OID 0)
-- Dependencies: 200
-- Name: ecosystem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecosystem_id_seq OWNED BY public.ecosystem.id;


--
-- TOC entry 209 (class 1259 OID 16464)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id bigint NOT NULL,
    source json NOT NULL,
    collection integer,
    catalog integer NOT NULL,
    stac_version character varying(20) NOT NULL,
    stac_extensions character varying(50)[] NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 16462)
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
-- TOC entry 3052 (class 0 OID 0)
-- Dependencies: 208
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- TOC entry 205 (class 1259 OID 16436)
-- Name: queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue (
    id bigint NOT NULL,
    url text NOT NULL,
    type character varying(11) NOT NULL,
    accessed timestamp without time zone,
    checks integer DEFAULT 0 NOT NULL,
    catalog integer NOT NULL
);


ALTER TABLE public.queue OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 16434)
-- Name: queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.queue_id_seq OWNER TO postgres;

--
-- TOC entry 3053 (class 0 OID 0)
-- Dependencies: 204
-- Name: queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_id_seq OWNED BY public.queue.id;


--
-- TOC entry 2880 (class 2604 OID 16411)
-- Name: catalogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs ALTER COLUMN id SET DEFAULT nextval('public.catalogs_id_seq'::regclass);


--
-- TOC entry 2883 (class 2604 OID 16458)
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- TOC entry 2879 (class 2604 OID 16400)
-- Name: ecosystem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem ALTER COLUMN id SET DEFAULT nextval('public.ecosystem_id_seq'::regclass);


--
-- TOC entry 2885 (class 2604 OID 16467)
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- TOC entry 2881 (class 2604 OID 16439)
-- Name: queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue ALTER COLUMN id SET DEFAULT nextval('public.queue_id_seq'::regclass);


--
-- TOC entry 3054 (class 0 OID 0)
-- Dependencies: 202
-- Name: catalogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.catalogs_id_seq', 1, false);


--
-- TOC entry 3055 (class 0 OID 0)
-- Dependencies: 206
-- Name: collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.collections_id_seq', 1, false);


--
-- TOC entry 3056 (class 0 OID 0)
-- Dependencies: 200
-- Name: ecosystem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ecosystem_id_seq', 1, false);


--
-- TOC entry 3057 (class 0 OID 0)
-- Dependencies: 208
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 1, false);


--
-- TOC entry 3058 (class 0 OID 0)
-- Dependencies: 204
-- Name: queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_id_seq', 1, false);


--
-- TOC entry 2891 (class 2606 OID 16416)
-- Name: catalogs catalogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);


--
-- TOC entry 2893 (class 2606 OID 16418)
-- Name: catalogs catalogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_slug_key UNIQUE (slug);


--
-- TOC entry 2895 (class 2606 OID 16420)
-- Name: catalogs catalogs_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_url_key UNIQUE (url);


--
-- TOC entry 2887 (class 2606 OID 16405)
-- Name: ecosystem ecosystem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_pkey PRIMARY KEY (id);


--
-- TOC entry 2889 (class 2606 OID 16422)
-- Name: ecosystem ecosystem_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_url_key UNIQUE (url);


--
-- TOC entry 2901 (class 2606 OID 16472)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 2897 (class 2606 OID 16445)
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (id);


--
-- TOC entry 2899 (class 2606 OID 16447)
-- Name: queue queue_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_url_key UNIQUE (url);


--
-- TOC entry 2902 (class 2606 OID 16448)
-- Name: queue queue_catalog_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_catalog_fkey FOREIGN KEY (catalog) REFERENCES public.catalogs(id) ON DELETE CASCADE;


-- Completed on 2020-12-31 00:28:56

--
-- PostgreSQL database dump complete
--

