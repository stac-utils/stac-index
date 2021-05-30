<template>
  <div id="stac-index">
    <header>
      <b-navbar toggleable="lg" type="dark" class="stac-nav" variant="info">
        <b-navbar-brand to="/" :exact="true">
          <img src="./assets/logo2.png" class="nav-logo d-inline-block align-top" alt="STAC Index">
          STAC Index
        </b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/catalogs">Catalogs</b-nav-item>
            <b-nav-item to="/collections">Collection Search</b-nav-item>
            <b-nav-item to="/ecosystem">Ecosystem</b-nav-item>
            <b-nav-item to="/add" title="Add new Catalog or Tool"><b-icon icon="plus-circle-fill" /></b-nav-item>
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/contact">Contact</b-nav-item>
            <b-nav-item to="/privacy">Privacy Policy</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </header>
    <main>
      <router-view/>
    </main>
  </div>
</template>

<style>
#stac-index {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: black;
}

#stac-index .content {
  padding-top: 30px;
  padding-bottom: 15px;
}

#stac-index .bg-info {
  background-color: #144E63 !important;
}

#stac-index h1, #stac-index h2, #stac-index h3, #stac-index h4, #stac-index h5, #stac-index h6 {
  color: #144E63;
}

#stac-index a, #stac-index .list-group-item .styled-description a, #stac-index a.list-group-item h5 {
  color: #09B3AD;
}
#stac-index a:hover, #stac-index .list-group-item .styled-description a:hover, #stac-index a:hover.list-group-item h5 {
  color: #144E63;
}
#stac-index .stac-nav a {
  color: white;
  font-weight: bold;
}
#stac-index .stac-nav a.disabled, #stac-index .nav a.disabled {
  opacity: 0.5;
}
#stac-index .stac-nav a:hover {
  color: #09B3AD;
}
#stac-index .stac-nav a.router-link-active {
  color: #09B3AD;
}
#stac-index .stac-nav .nav-logo {
  height: 30px;
}
#stac-index .nav-pills a.active {
  background-color: #144E63;
  color: white;
  font-weight: normal;
}
#stac-index .nav-pills a {
  color: #144E63;
  font-weight: normal;
}

#stac-index .list-group-item small, #stac-index a.list-group-item  {
  color: black;
}

#stac-index .badge {
  margin: 1px;
}
#stac-index h6 {
  margin-top: 1em;
}

#stac-index .styled-description h1 {
  font-size: 1.2em;
}
#stac-index .styled-description h2 {
  font-size: 1.1em;
}
#stac-index .styled-description h3, #stac-index .styled-description h4, #stac-index .styled-description h5, #stac-index .styled-description h6 {
  font-size: 1em;
}
#stac-index .styled-description 
#stac-index .styled-description p {
  line-height: 1.5em;
  margin-bottom: 0.5em;
}
#stac-index .styled-description p:last-of-type {
  margin-bottom: 0;
}
</style>
