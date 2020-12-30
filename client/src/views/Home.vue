<template>
  <b-container class="content home">
    <b-jumbotron>
      <template v-slot:header>
        <img alt="STAC logo" class="logo" src="../assets/logo.png"><br />
        Welcome to the STAC Index!
      </template>
      <template v-slot:lead>
        Here you can find STAC Catalogs, Collections, APIs, Software and Tools.<br />
        You can also add your own data and tools to the list.
      </template>
      <hr class="my-4">
      <p>You don't know STAC yet? Check it out at <a href="https://stacspec.org" target="_blank">stacspec.org</a>.</p>

      <b-button to="/catalogs">Catalogs</b-button>
      <b-button to="/collections">Collection Search</b-button>
      <b-button to="/ecosystem">Ecosystem</b-button>
    </b-jumbotron>

    <template v-if="newest.data.length > 0 || newest.ecosystem.length > 0">
      <h2>Recently added</h2>
      <b-card-group deck>
        <b-card header="Catalogs" v-if="newest.data.length > 0">
          <b-list-group>
            <DataItem v-for="data in newest.data" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>

        <b-card header="Ecosystem" v-if="newest.ecosystem.length > 0">
          <b-list-group>
            <EcosystemItem v-for="data in newest.ecosystem" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>
      </b-card-group>
    </template>

  </b-container>
</template>

<script>
import DataItem from './DataItem.vue';
import EcosystemItem from './EcosystemItem.vue';

export default {
  name: 'Home',
  components: {
    DataItem,
    EcosystemItem
  },
  data() {
    return {
      newest: {
        data: [],
        ecosystem: []
      }
    };
  },
  async created() {
    try {
      let response = await this.$axios.get('/newest');
      this.newest = response.data;
    } catch (error) {
      console.error(error);
    }
  }
}
</script>

<style scoped>
.jumbotron {
  text-align: center;
  padding: 2rem;
}
#app .jumbotron a.btn {
  margin: 0 0.25em;
  background-color: #144E63;
  color: white;
}
#app .jumbotron a.btn:hover {
  background-color: #09B3AD;
}
.logo {
  padding-bottom: 30px;
  max-width: 100%;
}
</style>