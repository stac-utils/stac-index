<template>
  <b-container fluid class="browse content">
    <b-spinner v-if="data === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof data === 'string'" variant="danger" show>{{ data }}</b-alert>
    <template v-else-if="!showBrowser">
      <h1>{{ data.title }}</h1>
      <p><a :href="data.url" target="_blank"><code>{{ data.url }}</code></a></p>
      <b-alert variant="info" show>
        <p><strong>This {{ type }} is private!</strong></p>
        <Description :description="data.access" />
      </b-alert>
    </template>
    <template v-else>
      <b-alert v-if="isHttp || corsWarning" variant="warning" show>
        <template v-if="isHttp">
          This {{ type }} is accessible only via unsecured HTTP and can't be accessed directly from a secured web page.
        </template>
        <template v-if="corsWarning">
          This {{ type }} doesn't support <a href="https://developer.mozilla.org/de/docs/Web/HTTP/CORS" target="_blank">CORS</a>.
        </template>
        STAC Index tries to proxy the request, but links, images or other references might be broken while browing through the {{ type }}.
        The URLs shown below will include the STAC Index proxy (<code>{{ proxyUrl }}</code>) and should not be used as provided in the browser.
        Use the offical link to the {{ type }} instead:<br /><a :href="data.url" target="_blank"><code>{{ data.url }}</code></a>
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
    },
    collection: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      data: null,
      corsWarning: false,
      isHttp: false
    };
  },
  computed: {
    type() {
      if (this.collection) {
        return "Collection"
      }
      else if (this.data.isApi) {
        return "API";
      }
      else {
        return "Catalog";
      }
    },
    showBrowser() {
      return isPlainObject(this.data) && !this.data.isPrivate;
    },
    proxyUrl() {
      return this.$axios.defaults.baseURL + '/proxy?';
    }
  },
  async mounted() {
    try {
      let endpoint = (this.data ? '/collections/' : '/catalogs/') + this.id
      let response = await this.$axios.get(endpoint);
      if (!isPlainObject(response.data)) {
        this.data = "Information retrieved from the server are invalid.";
        return;
      }
      else {
        this.data = response.data;
        if (this.showBrowser) {
          let createBrowser = require('stac-browser/src/main').default;
          let url = this.data.url;
          if (url.startsWith('http://')) {
            url = this.makeProxyUrl(url);
            this.isHttp = true;
          }
          try {
            let response = await this.$axios.get(url, {
              timeout: 1000,
              maxContentLength: 0
            });
          } catch (error) {
            if(error.message == 'Network Error' || error.name == 'NetworkError') {
              url = this.makeProxyUrl(url);
              this.corsWarning = true;
            }
          }
          let browser = await createBrowser(url, this.$router.path);
        }
        else {
          document.title = this.data.title + " - STAC Index";
        }
      }
    } catch (error) {
      this.data = "Can't load information from the server: " + error.message;
      return;
    }
  },
  methods: {
    makeProxyUrl(url) {
      return this.proxyUrl + encodeURIComponent(url);
    }
  }
}
</script>

<style>
#stac-browser {
  margin: 0 -15px;
}
</style>