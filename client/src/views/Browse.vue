<template>
  <b-container class="browse content">
    <b-spinner v-if="collection === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof collection === 'string'" variant="danger" show>{{ collection }}</b-alert>
    <template v-else-if="!showBrowser">
      <h1>{{ collection.title }}</h1>
      <p><a :href="collection.url" target="_blank"><code>{{ collection.url }}</code></a></p>
      <b-alert variant="info" show>
        <p><strong>This {{ type }} is private!</strong></p>
        <Description :description="collection.access" />
      </b-alert>
    </template>
    <template v-else>
      <b-alert v-if="corsWarning" variant="warning" show>
        This {{ type }} doesn't support <a href="https://developer.mozilla.org/de/docs/Web/HTTP/CORS" target="_blank">CORS</a>.
        STAC Index tries to proxy the request, but links, images or other references might be broken while browing through the {{ type }}.
        The URLs shown below will include the STAC Index proxy (<code>http://localhost:9999/proxy?</code>) and should not be used as provided in the browser.
        Use the offical link to the {{ type }} instead:<br /><a :href="collection.url" target="_blank"><code>{{ collection.url }}</code></a>
      </b-alert>
      <div id="stac-browser"></div>
    </template>
  </b-container>
</template>

<script>
import isPlainObject from 'lodash/isPlainObject';
import { Description } from '@openeo/vue-components';

export default {
  name: 'Browse',
  components: {
    Description
  },
  props: {
    id: {
      type: String,
      validator: function (value) {
        return Boolean(value.match(/^[a-z0-9-]+$/i));
      }
    }
  },
  data() {
    return {
      collection: null,
      corsWarning: false
    };
  },
  computed: {
    type() {
      return this.collection.isApi ? "API" : "Collection";
    },
    showBrowser() {
      return isPlainObject(this.collection) && !this.collection.isPrivate;
    }
  },
  async mounted() {
    try {
      let response = await this.$axios.get('/collections/' + this.id);
      if (!isPlainObject(response.data)) {
        this.collection = "Information retrieved from the server are invalid.";
        return;
      }
      else {
        this.collection = response.data;
        if (this.showBrowser) {
          let createBrowser = require('stac-browser/src/main').default;
          let url = this.collection.url;
          try {
            let response = await this.$axios.get(url, {
              timeout: 1000,
              maxContentLength: 0
            });
          } catch (error) {
            if(error.message == 'Network Error' || error.name == 'NetworkError') {
              url = this.$axios.defaults.baseURL + '/proxy?' + encodeURIComponent(url);
              this.corsWarning = true;
            }
          }
          let browser = await createBrowser(url, this.$router.path);
        }
        else {
          document.title = this.collection.title + " - STAC Index";
        }
      }
    } catch (error) {
      this.collection = "Can't load information from the server: " + error.message;
      return;
    }
  }
}
</script>

<style>
#stac-browser {
  margin: 0 -15px;
}
</style>