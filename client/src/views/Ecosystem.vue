<template>
  <b-container class="ecosystem">
    <h1>Ecosystem</h1>
    <p>A list of software and tools for STAC.</p>
    <b-spinner v-if="ecosystem === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof ecosystem === 'string'" variant="error" show>{{ ecosystem }}</b-alert>
    <b-alert v-else-if="ecosystem.length === 0" show>No tool or software added yet.</b-alert>
    <b-row v-else>
      <div>
        Categories: <b-badge v-for="cat in categories" :key="cat">{{ cat }}</b-badge>
      </div>
      <div>
        Languages: <b-badge v-for="lang in languages" :key="lang">{{ lang }}</b-badge>
      </div>
      <b-list-group>
        <b-list-group-item v-for="(eco,i) in ecosystem" :key="i" :href="eco.url" target="_blank" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ eco.title }}</h5>
            <small v-if="language">{{ eco.language }}</small>
          </div>
          <p class="mb-1">{{ eco.summary }}</p>
        </b-list-group-item>
      </b-list-group>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: 'Ecosystem',
  data() {
    return {
      ecosystem: null
    };
  },
  computed: {
    languages() {
      if (!Array.isArray(this.ecosystem)) {
        return [];
      }
      let set = new Set();
      for(let eco of this.ecosystem) {
        if (eco.language) {
          set.add(eco.language);
        }
      }
      return Array.from(set);
    },
    categories() {
      if (!Array.isArray(this.ecosystem)) {
        return [];
      }
      let set = new Set();
      for(let eco of this.ecosystem) {
        if (Array.isArray(eco.categories)) {
          eco.categories.forEach(cat => set.add(cat));
        }
      }
      return Array.from(set);
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/ecosystem');
      this.ecosystem = response.data;
    } catch (error) {
      this.ecosystem = "Can't load ecosystem list from server. Please try again.";
    }
  }
}
</script>