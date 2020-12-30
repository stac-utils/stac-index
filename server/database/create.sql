--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 13.1

-- Started on 2020-12-30 15:04:54

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
-- TOC entry 3009 (class 0 OID 0)
-- Dependencies: 202
-- Name: catalogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogs_id_seq OWNED BY public.catalogs.id;


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
-- TOC entry 3010 (class 0 OID 0)
-- Dependencies: 200
-- Name: ecosystem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecosystem_id_seq OWNED BY public.ecosystem.id;


--
-- TOC entry 2859 (class 2604 OID 16411)
-- Name: catalogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs ALTER COLUMN id SET DEFAULT nextval('public.catalogs_id_seq'::regclass);


--
-- TOC entry 2858 (class 2604 OID 16400)
-- Name: ecosystem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem ALTER COLUMN id SET DEFAULT nextval('public.ecosystem_id_seq'::regclass);


--
-- TOC entry 3003 (class 0 OID 16408)
-- Dependencies: 203
-- Data for Name: catalogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.catalogs (id, url, slug, title, summary, email, access, access_info, is_api, created, updated) FROM stdin;
\.


--
-- TOC entry 3001 (class 0 OID 16397)
-- Dependencies: 201
-- Data for Name: ecosystem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ecosystem (id, url, title, summary, categories, language, email, extensions, api_extensions, created, updated) FROM stdin;
\.


--
-- TOC entry 3011 (class 0 OID 0)
-- Dependencies: 202
-- Name: catalogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.catalogs_id_seq', 1, false);


--
-- TOC entry 3012 (class 0 OID 0)
-- Dependencies: 200
-- Name: ecosystem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ecosystem_id_seq', 1, false);


--
-- TOC entry 2865 (class 2606 OID 16416)
-- Name: catalogs catalogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);


--
-- TOC entry 2867 (class 2606 OID 16418)
-- Name: catalogs catalogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_slug_key UNIQUE (slug);


--
-- TOC entry 2869 (class 2606 OID 16420)
-- Name: catalogs catalogs_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_url_key UNIQUE (url);


--
-- TOC entry 2861 (class 2606 OID 16405)
-- Name: ecosystem ecosystem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_pkey PRIMARY KEY (id);


--
-- TOC entry 2863 (class 2606 OID 16422)
-- Name: ecosystem ecosystem_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_url_key UNIQUE (url);


-- Completed on 2020-12-30 15:04:54

--
-- PostgreSQL database dump complete
--

