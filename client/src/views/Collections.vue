<template>
  <b-container class="collections">
    <h1>STAC Collections</h1>
    <p>A list of STAC Collections. This is WIP and currently only shows a list of the static catalogs!</p>
    <b-spinner v-if="collections === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof collections === 'string'" variant="error" show>{{ collections }}</b-alert>
    <template v-else>
      <h6>Filter by Access Level</h6>
      <b-nav pills small>
        <b-nav-item :active="access === null" to="/collections">All</b-nav-item>
        <b-nav-item :active="access === true" to="/collections?access=true">Public Only</b-nav-item>
        <b-nav-item :active="access === false" to="/collections?access=false">Private Only</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No Collections found.</b-alert>
      <b-list-group v-else>
        <b-list-group-item v-for="(col,i) in filtered" :key="i" :href="col.url" target="_blank" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ col.title }}</h5>
            <small>
              <b-badge v-if="col.isPrivate" variant="dark" :id="'col_access_' + i">Private</b-badge>
              <b-badge v-else variant="success">Public</b-badge>
              <b-tooltip :target="'col_access_' + i" triggers="hover">
                <Description :description="col.access" />
              </b-tooltip>
            </small>
          </div>
          <Description :description="col.summary" />
          <small><code>{{ col.url }}</code></small>
        </b-list-group-item>
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import { Description } from '@openeo/vue-components';

export default {
  name: 'Collections',
  components: {
    Description
  },
  props: {
    access: {
      type: Boolean,
      default: null
    }
  },
  data() {
    return {
      collections: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.collections)) {
        return [];
      }

      return this.collections.filter(col => {
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
      let response = await this.$axios.get('/collections');
      this.collections = response.data;
    } catch (error) {
      this.collections = "Can't load list of Collections from server. Please try again.";
    }
  }
}
</script>

<style scoped>
</style>