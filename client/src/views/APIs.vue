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
        <b-list-group-item v-for="(col,i) in filtered" :key="i" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1"><b-link :to="'/collections/' + col._id">{{ col.title }}</b-link></h5>
            <small>
              <b-badge v-if="col.isPrivate" variant="dark" :id="'access_' + i">Private</b-badge>
              <b-badge v-else variant="success">Public</b-badge>
              <b-tooltip v-if="col.isPrivate" :target="'access_' + i" triggers="hover">
                <Description :description="col.access" />
              </b-tooltip>
            </small>
          </div>
          <Description :description="col.summary" />
          <small><code><b-link :href="col.url" target="_blank">{{ col.url }}</b-link></code></small>
        </b-list-group-item>
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import { Description } from '@openeo/vue-components';

export default {
  name: 'APIs',
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