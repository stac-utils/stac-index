<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :to="'/catalogs/' + data.slug">{{ data.title }}</b-link></h5>
      <small class="header-badges">
        <b-badge v-if="data.isApi" variant="secondary">API</b-badge>
        <b-badge v-else variant="secondary" title="Static Catalog">Catalog</b-badge>
        
        <b-badge v-if="data.access === 'private'" variant="danger">Private</b-badge>
        <b-badge v-else-if="data.access === 'protected'" variant="warning">Protected</b-badge>
        <b-badge v-else variant="success">Public</b-badge>
      </small>
    </div>
    <div class="styled-description summary">
      <p v-html="parseLink(data.summary)"></p>
    </div>
    <small class="url"><b-icon icon="link" /> <code><b-link :href="data.url" target="_blank">{{ data.url }}</b-link></code></small>
  </b-list-group-item>
</template>

<script>
import { Description } from '@openeo/vue-components';
import Utils from '../utils';

export default {
  name: 'DataItem',
  components: {
    Description
  },
  props: {
    data: {
      type: Object
    }
  },
  methods: {
    parseLink(text) {
      return Utils.parseLink(text);
    }
  }
};
</script>

<style scoped>
.header-badges {
  white-space: nowrap;
}
small.url {
  display: block;
  line-height: 1.25em;
  margin: 0.25em 0;
}
small.url code {
  font-size: 100%;
}
</style>