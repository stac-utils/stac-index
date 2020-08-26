<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :href="data.url" target="_blank">{{ data.title }}</b-link></h5>
      <small><b-badge v-if="data.language">{{ data.language }}</b-badge></small>
    </div>
    <Description :description="data.summary" />
    <small>
      Categories:
      <b-badge v-for="cat in data.categories" :key="cat">{{ cat }}</b-badge>
    </small>
  </b-list-group-item>
</template>

<script>
import { Description } from '@openeo/vue-components';

export default {
  name: 'EcosystemItem',
  components: {
    Description
  },
  props: {
    data: {
      type: Object
    }
  }
};
</script>