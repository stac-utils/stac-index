<template>
  <b-container class="add">
    <h1>Add new Catalog or Tool</h1>
    <b-form @submit="submit">
      <h5>What do you want to add?</h5>
      <b-form-group>
        <b-form-radio-group v-model="type" id="type" name="type" :options="typeList"></b-form-radio-group>
      </b-form-group>
      <template v-if="type">
        <h5>{{ formTitle }}</h5>
        <b-form-group v-if="fields.includes('url')" label="URL:" label-for="url" required>
          <b-form-input id="url" type="url" v-model="url"></b-form-input>
          <b-form-text>This URL must be publicly accessible.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('title')" label="Name of the software or tool:" label-for="title" required>
          <b-form-input id="title" type="text" v-model="title"></b-form-input>
        </b-form-group>
        <b-form-group v-if="fields.includes('summary')" label="Summary:" label-for="summary" required>
          <b-form-textarea id="summary" v-model="summary" rows="3"></b-form-textarea>
          <b-form-text>Short summary about the {{ formTitle }}. Min. 100 chars, max. 1000 chars.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('categories')" label="Categories:" label-for="categories">
          <b-form-input id="categories" type="text" v-model="categories"></b-form-input>
        </b-form-group>
        <b-form-group v-if="fields.includes('language')" label="Programming Language:" label-for="language">
          <b-form-input id="language" type="text" v-model="language"></b-form-input>
          <b-form-text>This should be the main programming language.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('email')" label="Contact e-mail:" label-for="email">
          <b-form-input id="email" type="email" v-model="email"></b-form-input>
          <b-form-text>Not publicly displayed. Just used to contact you in case we have questions regarding your submission.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('private')" label="Access" label-for="private">
          <b-form-checkbox id="private" v-model="accessPrivate" name="private" :value="true" :unchecked-value="false">This is a private {{ formTitle }}.</b-form-checkbox>
          <b-form-textarea v-if="accessPrivate" id="access" v-model="access" rows="3" required></b-form-textarea>
          <b-form-text v-if="accessPrivate">Please give information how interested parties can gain access to the {{ formTitle }}. Min. 100 chars, max. 1000 chars.</b-form-text>
        </b-form-group>
        <b-button type="submit" variant="primary">Submit</b-button>
      </template>
    </b-form>
  </b-container>
</template>

<script>
      // addSoftware(url, title, summary, categories = [], language = null, email = null)
      // addCatalog(isApi, url, summary, access = null, email = null)
export default {
  name: 'Add',
  data() {
    return {
      typeList: [
          { text: 'Static Catalog', value: 'catalog' },
          { text: 'API', value: 'api' },
          { text: 'Tool / Software', value: 'ecosystem' }
      ],
      languageList: [],
      categoryList: [],
      type: null,
      url: null,
      title: null,
      summary: null,
      language: null,
      categories: [],
      accessPrivate: false,
      access: null,
      email: null
    };
  },
  computed: {
    formTitle() {
      let type = this.typeList.find(t => t.value === this.type);
      if (type) {
        return type.text;
      }
      else {
        return null;
      }
    },
    fields() {
      let fields = ['url', 'summary', 'email'];
      if (this.type === 'catalog' || this.type === 'api') {
        fields.push('private');
      }
      else if (this.type === 'catalog') {
        fields.push('language');
        fields.push('categories');
      }
      return fields;
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/languages');
      this.languageList = response.data;
    } catch (error) {
      console.error("Can't load list of programming languages.");
    }
    try {
      let response = await this.$axios.get('/categories');
      this.categoryList = response.data;
    } catch (error) {
      console.error("Can't load list of categories.");
    }
  },
  methods: {
    submit() {

    }
  }
}
</script>