<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :to="'/collections/' + data.slug">{{ data.title }}</b-link></h5>
      <small class="header-badges">
        <b-badge v-if="mixed && data.isApi" variant="secondary">API</b-badge>
        <b-badge v-else-if="mixed" variant="secondary" title="Static Catalog">Catalog</b-badge>
        
        <b-badge v-if="data.isPrivate" variant="dark" :id="'access_' + data._id">Private</b-badge>
        <b-badge v-else variant="success">Public</b-badge>
        <b-tooltip v-if="data.isPrivate" :target="'access_' + data._id" triggers="hover">
          <Description :description="data.access" />
        </b-tooltip>
      </small>
    </div>
    <Description :description="data.summary" />
    <small><code><b-link :href="data.url" target="_blank">{{ data.url }}</b-link></code></small>
  </b-list-group-item>
</template>

<script>
import { Description } from '@openeo/vue-components';

export default {
  name: 'DataItem',
  components: {
    Description
  },
  props: {
    data: {
      type: Object
    },
    mixed: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.header-badges {
  white-space: nowrap;
}
</style>