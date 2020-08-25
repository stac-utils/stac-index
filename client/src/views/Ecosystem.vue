<template>
  <b-container class="content ecosystem">
    <h1>Ecosystem</h1>
    <p>A list of software and tools for STAC.</p>
    <b-spinner v-if="ecosystem === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof ecosystem === 'string'" variant="danger" show>{{ ecosystem }}</b-alert>
    <template v-else>
      <h6>Filter by Category</h6>
      <b-nav pills small>
        <b-nav-item :active="!category" :to="'/ecosystem?category=&language='+encodeURIComponent(language)">All</b-nav-item>
        <b-nav-item v-for="cat in categories" :key="cat" :active="category === cat" :to="'/ecosystem?category='+cat+'&language='+encodeURIComponent(language)">{{ cat }}</b-nav-item>
      </b-nav>
      <h6>Filter by Programming Language</h6>
      <b-nav pills small>
        <b-nav-item :active="!language" :to="'/ecosystem?category='+encodeURIComponent(category)+'&language='">All</b-nav-item>
        <b-nav-item v-for="lang in languages" :key="lang" :active="language === lang" :to="'/ecosystem?category='+encodeURIComponent(category)+'&language='+encodeURIComponent(lang)">{{ lang }}</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No tool or software found.</b-alert>
      <b-list-group v-else>
        <b-list-group-item v-for="(eco,i) in filtered" :key="i" :href="eco.url" target="_blank" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ eco.title }}</h5>
            <small><b-badge v-if="eco.language">{{ eco.language }}</b-badge></small>
          </div>
          <p class="mb-1">{{ eco.summary }}</p>
          <small>
            Categories:
            <b-badge v-for="cat in eco.categories" :key="cat">{{ cat }}</b-badge>
          </small>
        </b-list-group-item>
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
export default {
  name: 'Ecosystem',
  props: {
    language: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      ecosystem: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.ecosystem)) {
        return [];
      }

      return this.ecosystem.filter(eco => {
        if (this.category && !eco.categories.includes(this.category)) {
          return false;
        }
        if (this.language && eco.language !== this.language) {
          return false;
        }

        return true;
      });
    },
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

<style scoped>
</style>