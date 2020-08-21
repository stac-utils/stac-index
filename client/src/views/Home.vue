<template>
  <b-container class="home">
    <img alt="STAC logo" class="logo" src="../assets/logo.png">
    <div class="hello">
      <h1>Welcome to the STAC Index!</h1>
      <p>
        Here you can find STAC Collections, APIs, Software and Tools.
        You can also add your own data and tools to the list.
      </p>
      <p>
        You don't know STAC yet? Check it out at <a href="https://stacspec.org" target="_blank">stacspec.org</a>.
      </p>
    </div>
  </b-container>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  text-align: center;
}
.logo {
  padding-bottom: 30px;
  max-width: 100%;
}
</style>