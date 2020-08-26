<template>
  <div :class="{browse: true, container: !showBrowser, content: !showBrowser, browser: showBrowser}">
    <iframe v-if="showBrowser" :src="url"></iframe>
    <b-spinner v-else-if="collection === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof collection === 'string'" variant="danger" show>{{ collection }}</b-alert>
    <template v-else-if="collection.isPrivate">
      <h1>{{ collection.title }}</h1>
      <p><a :href="collection.url" target="_blank"><code>{{ collection.url }}</code></a></p>
      <b-alert variant="info" show>
        <p>
          <strong v-if="collection.isApi">This API is private!</strong>
          <strong v-else>This Collection is private!</strong>
        </p>
        <Description :description="collection.access" />
      </b-alert>
    </template>
  </div>
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
        return Boolean(value.match(/^\w+$/i));
      }
    }
  },
  data() {
    return {
      collection: null
    };
  },
  computed: {
    url() {
      return '/browse?' + this.id;
    },
    showBrowser() {
      return isPlainObject(this.collection) && !this.collection.isPrivate;
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/collections/' + this.id);
      if (!isPlainObject(response.data)) {
        this.collection = "Information retrieved from the server are invalid.";
        return;
      }
      else {
        this.collection = response.data;
      }
    } catch (error) {
      this.collection = "Can't load information from the server: " + error.message;
      return;
    }
  }
}
</script>

<style scoped>
.browser, .browser iframe {
  height: 100%;
  width: 100%;
  border: 0;
  margin: 0;
  padding: 0;
  display: block;
}
</style>