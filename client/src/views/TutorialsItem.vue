<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :href="data.url" target="_blank">{{ data.title }}</b-link></h5>
      <small><b-badge v-if="data.language">{{ data.language.toUpperCase() }}</b-badge></small>
      <!-- ToDo: Display full language name -->
    </div>
    <div class="styled-description summary">
      <p>{{ data.summary }}</p>
    </div>
    <small>
      <b-badge v-for="tag in tags" :key="tag">{{ tag }}</b-badge>
    </small>
  </b-list-group-item>
</template>

<script>

export default {
  name: 'EcosystemItem',
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    tags() {
      return this.data.tags.map(tag => tag.toUpperCase()).sort();
    }
  }
};
</script>