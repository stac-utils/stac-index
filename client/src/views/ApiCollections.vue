<template>
  <b-container class="api-collections">
    <b-spinner v-if="api === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof api === 'string'" variant="danger" show>{{ api }}</b-alert>
    <template v-else>
      <h1>STAC Collections for {{ api.title }}</h1>
      <p><a :href="api.url" target="_blank"><code>{{ api.url }}</code></a></p>
      <b-spinner v-if="collections === null" label="Loading..."></b-spinner>
      <b-alert v-else-if="typeof collections === 'string'" variant="warning" show>{{ collections }}</b-alert>
      <b-container class="collection-list" v-else>
        <Collection v-for="c in collections" :key="c.id" :collectionData="c" :initiallyCollapsed="true" :mapOptions="{scrollWheelZoom: false, wrapAroundAntimeridian: false}"></Collection>
      </b-container>
    </template>
  </b-container>
</template>

<script>
import isPlainObject from 'lodash/isPlainObject';
import { Collection } from '@openeo/vue-components';
import "leaflet/dist/leaflet.css";

export default {
  name: 'ApiCollections',
  components: {
    Collection
  },
  props: {
    id: {
      type: String
    }
  },
  data() {
    return {
      api: null,
      collections: null
    };
  },
  async created() {
    try {
      let response = await this.$axios.get('/collections/' + this.id);
      if (!isPlainObject(response.data)) {
        this.api = "STAC API information retrieved from the server are invalid.";
      }
      else if (!response.data.isApi) {
        this.api = "Requested dataset is not an API.";
      }
      else {
        this.api = response.data;
      }
    } catch (error) {
      this.api = "Can't load STAC API information from the server. Please try again.";
      return;
    }
    try {
      let response = await this.$axios.get(this.api.url + '/collections');
      if (!isPlainObject(response.data) || !Array.isArray(response.data.collections)) {
        this.collections = "STAC API collections retrieved from the server are invalid.";
      }
      else {
        this.collections = response.data.collections;
      }
    } catch (error) {
      this.collections = "Can't load collections from the server, please follow the link above.";
      return;
    }
  }
}
</script>

<style>
.collection-list h2, .collection-list h1 {
  font-size: 1.2rem;
  margin: 0;
}
.collection-list summary {
  margin-top: 0.25em;
}
.collection-list h3, .collection-list h4, .collection-list h5, .collection-list h6 {
  font-size: 1.1rem;
}
.collection-list .collection {
  margin-bottom: 0.5em;
}
.collection-list .collection .tabular {
  margin: 0;
}
.collection-list .collection section {
  margin: 1em 0;
}
</style>