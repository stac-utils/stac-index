<template>
  <b-container class="content apis">
    <h1>STAC APIs</h1>
    <p>A list of STAC APIs. This is WIP!</p>
    <b-spinner v-if="data === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof data === 'string'" variant="danger" show>{{ data }}</b-alert>
    <template v-else>
      <h6>Filter by Access Level</h6>
      <b-nav pills small>
        <b-nav-item :active="access === null" to="/apis">All</b-nav-item>
        <b-nav-item :active="access === true" to="/apis?access=true">Public Only</b-nav-item>
        <b-nav-item :active="access === false" to="/apis?access=false">Private Only</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No API found.</b-alert>
      <b-list-group v-else>
        <DataItem v-for="data in filtered" :key="data._id" :data="data" />
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import DataItem from './DataItem.vue';

export default {
  name: 'APIs',
  components: {
    DataItem
  },
  props: {
    access: {
      type: Boolean,
      default: null
    }
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
        if (this.access === true && col.isPrivate) {
          return false;
        }
        else if (this.access === false && !col.isPrivate) {
          return false;
        }

        return true;
      });
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/apis');
      this.data = response.data;
    } catch (error) {
      this.data = "Can't load list of APIs from the server: " + error.message;
    }
  }
}
</script>