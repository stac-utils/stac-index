<template>
  <div id="app">
    <nav>
      <b-navbar toggleable="lg" type="dark" class="stac-nav" variant="info">
        <b-navbar-brand href="#/">
          <img src="./assets/logo2.png" class="nav-logo d-inline-block align-top" alt="STAC Index">
          STAC Index
        </b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/collections">Collections</b-nav-item>
            <b-nav-item to="/apis">APIs</b-nav-item>
            <b-nav-item to="/ecosystem">Ecosystem</b-nav-item>
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/add">Add</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </nav>
    <main>
      <router-view/>
    </main>
  </div>
</template>

<style>
main {
  padding-top: 30px;
  padding-bottom: 15px;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: black;
}

#app .bg-info {
  background-color: #144E63 !important;
}

#app h1, #app h2, #app h3, #app h4, #app h5, #app h6 {
  color: #144E63 !important;
}

#app a {
  color: #09B3AD;
}
#app a:hover {
  color: #144E63;
}

#app nav a, #app .nav a {
  color: white;
  font-weight: bold;
}
.tooltip a {
  color: #09B3AD;
}
.tooltip a:hover {
  color: white;
  text-decoration: underline;
}
#app nav a.disabled, #app .nav a.disabled {
  opacity: 0.5;
}
#app nav a:hover {
  color: #09B3AD;
}
#app nav a.router-link-active {
  color: #09B3AD;
}
#app nav .nav-logo {
  height: 30px;
}
#app .nav-pills a.active {
  background-color: #144E63;
  color: white;
  font-weight: normal;
}
#app .nav-pills a {
  color: #144E63;
  font-weight: normal;
}
#app .list-group-item small {
  color: black;
}

#app .badge {
  margin: 1px;
}
#app h6 {
  margin-top: 1em;
}
#app .styled-description p {
  line-height: 1.5em;
  margin-bottom: 0.5em;
}
#app .styled-description p:last-of-type {
  margin-bottom: 0;
}
</style>
