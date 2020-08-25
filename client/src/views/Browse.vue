<template>
  <iframe class="browser" :src="url"></iframe>
</template>

<script>
export default {
  name: 'Browse',
  props: {
    id: {
      type: String,
      validator: function (value) {
        return Boolean(value.match(/^\w+$/i));
      }
    }
  },
  computed: {
    url() {
      return '/browse?' + this.id;
    }
  }
}
</script>

<style scoped>
.browser {
  height: 100%;
  width: 100%;
  border: 0;
  margin: 0;
  padding: 0;
  display: block;
}
</style>