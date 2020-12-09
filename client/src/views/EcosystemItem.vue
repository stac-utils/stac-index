<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :href="data.url" target="_blank">{{ data.title }}</b-link></h5>
      <small><b-badge v-if="data.language">{{ data.language }}</b-badge></small>
    </div>
    <div class="styled-description summary">
      <p v-html="parseLink(data.summary)"></p>
    </div>
    <small>
      Categories:
      <b-badge v-for="cat in data.categories" :key="cat">{{ cat }}</b-badge>
    </small>
    <small v-if="extensions.length">
      <br />Supported Extensions:
      <b-badge v-for="ext in extensions" :key="ext">{{ ext }}</b-badge>
    </small>
    <small v-if="apiExtensions.length">
      <br />Supported API Extensions:
      <b-badge v-for="ext in apiExtensions" :key="ext">{{ ext }}</b-badge>
    </small>
  </b-list-group-item>
</template>

<script>
import { Description } from '@openeo/vue-components';
import Utils from '../utils';
import { EXTENSIONS, API_EXTENSIONS } from '../../../commons';

export default {
  name: 'EcosystemItem',
  components: {
    Description
  },
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    extensions() {
      return this.formatExtensions(this.data.extensions, EXTENSIONS).sort();
    },
    apiExtensions() {
      return this.formatExtensions(this.data.apiExtensions, API_EXTENSIONS).sort();
    }
  },
  methods: {
    formatExtensions(ext, list) {
      if (Array.isArray(ext) && ext.length > 0) {
        return ext.map(e => list[e] || null).filter(e => e !== null);
      }
      return [];
    },
    parseLink(text) {
      return Utils.parseLink(text);
    }
  }
};
</script>