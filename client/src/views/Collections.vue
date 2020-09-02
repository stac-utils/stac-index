<template>
  <b-container class="content collections">
    <h1>Collection Search</h1>
    <p>A searchable list of all STAC Collections.</p>
    <b-spinner v-if="data === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof data === 'string'" variant="danger" show>{{ data }}</b-alert>
    <template v-else>
      <b-alert v-if="filtered.length === 0" show>
        No Collections found.
        This functionality has not been implemented yet.
        The idea is to crawl all STAC catalogs and APIs so that you can search on all of them here using the Collection Summaries.
        Stay tuned!
      </b-alert>
      <b-list-group v-else>
        <DataItem v-for="item in data" :key="item._id" :data="item" />
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import DataItem from './DataItem.vue';

export default {
  name: 'Collections',
  components: {
    DataItem
  },
  props: {
  },
  data() {
    return {
      data: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.data)) {
        return [];
      }

      return this.data.filter(col => {
        // ToDo: Implement filter
        return true;
      });
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/collections');
      this.data = response.data;
    } catch (error) {
      this.data = "Can't load list of Collections from the server: " + error.message;
    }
  }
}
</script>