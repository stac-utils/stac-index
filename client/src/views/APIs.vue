<template>
  <b-container class="content apis">
    <h1>STAC APIs</h1>
    <p>A list of STAC APIs. This is WIP!</p>
    <b-spinner v-if="apis === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof apis === 'string'" variant="danger" show>{{ apis }}</b-alert>
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
        <b-list-group-item v-for="(api,i) in filtered" :key="i" :to="'/browse/' + api._id" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ api.title }}</h5>
            <small>
              <b-badge v-if="api.isPrivate" variant="dark" :id="'api_access_' + i">Private</b-badge>
              <b-badge v-else variant="success">Public</b-badge>
              <b-tooltip :target="'api_access_' + i" triggers="hover">
                <Description :description="api.access" />
              </b-tooltip>
            </small>
          </div>
          <Description :description="api.summary" />
          <small><code>{{ api.url }}</code></small>
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
      apis: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.apis)) {
        return [];
      }

      return this.apis.filter(api => {
        if (this.access === true && api.isPrivate) {
          return false;
        }
        else if (this.access === false && !api.isPrivate) {
          return false;
        }

        return true;
      });
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/apis');
      this.apis = response.data;
    } catch (error) {
      this.apis = "Can't load list of APIs from server. Please try again.";
    }
  }
}
</script>

<style scoped>
</style>