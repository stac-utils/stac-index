<template>
  <b-container class="content add">
    <h1>Add new Catalog or Tool</h1>
    <b-alert v-if="typeof error === 'string'" variant="danger" show>{{ error }}</b-alert>
    <b-alert v-else-if="typeof confirmation === 'string'" :variant="urlHintType" show>{{ confirmation }}</b-alert>
    <b-form @submit="onSubmit">
      <h5>What do you want to add?</h5>
      <b-form-group>
        <b-form-radio-group v-model="type" id="type" name="type" :options="typeList"></b-form-radio-group>
      </b-form-group>
      <template v-if="type">
        <h5>{{ formTitle }}</h5>
        <b-form-group v-if="fields.includes('url')" label="URL:" label-for="url">
          <b-form-input id="url" type="url" v-model="url" required></b-form-input>
          <b-form-text v-if="type !== 'ecosystem'">
            HTTPS should be used instead of HTTP whenever available.
            This URL must be publicly accessible or you must select "private" below.
            It must be the URL of the root catalog / API landing page.
          </b-form-text>
          <b-alert v-if="urlHint" :variant="urlHintType" show>{{ urlHint }}</b-alert>
        </b-form-group>
        <b-form-group v-if="fields.includes('title')" :label="type === 'ecosystem' ? 'Name of the software or tool:' : 'Title:'" label-for="title">
          <b-form-input id="title" type="text" v-model="title" required minlength="3" maxlength="50"></b-form-input>
          <b-form-text>Min. 3 chars, max. 50 chars.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('slug')" label="Slug" label-for="title">
          <b-form-input id="slug" type="text" v-model="slug" required minlength="3" maxlength="50" @keydown="stopSlugGen" @mousedown="stopSlugGen"></b-form-input>
          <b-form-text>Short identifier for the URL. Min. 3 chars, max. 50 chars. Allowed chars: <code>a-z</code>, <code>0-9</code>, <code>-</code></b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('summary')" label="Summary:" label-for="summary">
          <b-form-textarea id="summary" v-model="summary" rows="3" required minlength="50" maxlength="300"></b-form-textarea>
          <b-form-text>Short summary about the {{ formTitle }}. Min. 50 chars, max. 300 chars. One CommonMark (Markdown) style link allowed.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('categories')" label="Categories:" label-for="categories">
          <multiselect v-model="categories" :options="categoryList" :multiple="true" :taggable="true"></multiselect>
        </b-form-group>
        <b-form-group v-if="fields.includes('language')" label="Programming Language:" label-for="language">
          <multiselect v-model="language" :options="languageList"></multiselect>
          <b-form-text>This should be the main programming language.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('email')" label="Contact e-mail:" label-for="email">
          <b-form-input id="email" type="email" v-model="email"></b-form-input>
          <b-form-text>Not publicly displayed. Just used to contact you in case we have questions regarding your submission.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('private')" label="Access:" label-for="private">
          <b-form-checkbox id="private" v-model="accessPrivate" name="private" :value="true" :unchecked-value="false">This is a private {{ formTitle }}.</b-form-checkbox>
          <b-form-textarea v-if="accessPrivate" id="access" v-model="access" rows="3" required minlength="100" maxlength="1000"></b-form-textarea>
          <b-form-text v-if="accessPrivate">Please give information how interested parties can gain access to the {{ formTitle }}. CommonMark (Markdown) is supported. Min. 100 chars, max. 1000 chars.</b-form-text>
        </b-form-group>
        <b-button type="submit" variant="primary">Submit</b-button>
      </template>
    </b-form>
  </b-container>
</template>

<script>
import Multiselect from 'vue-multiselect';
import slugify from 'slugify';
import isPlainObject from 'lodash/isPlainObject';

export default {
  name: 'Add',
  components: {
    Multiselect
  },
  data() {
    return {
      typeList: [
          { text: 'Static Catalog', value: 'catalog' },
          { text: 'API', value: 'api' },
          { text: 'Tool / Software', value: 'ecosystem' }
      ],
      languageList: [],
      categoryList: [],
      error: null,
      confirmation: null,
      type: null,
      url: null,
      slug: '',
      title: null,
      summary: null,
      language: null,
      categories: [],
      accessPrivate: false,
      access: null,
      email: null,
      customSlug: false,
      urlHint: "",
      urlHintType: "info"
    };
  },
  watch: {
    async url(newUrl) {
      if ((this.type === 'catalog' || this.type === 'api') && typeof newUrl === 'string' && newUrl.startsWith('https://') && newUrl.length > 10) {
        this.urlHint = "Trying to read the URL...";
        this.urlHintType = "info";
        let catalog;
        try {
          catalog = await this.$axios.get(newUrl);
        } catch (error) {
          try {
            catalog = await this.$axios.get(this.proxyUrl + encodeURIComponent(newUrl));
          } catch (error) {
            this.accessPrivate = true;
            this.urlHint = "Can't read the specified URL. Is the catalog private? Setting the API as 'private' for you...";
            this.urlHintType = "warning";
            return;
          }
        }

        if (isPlainObject(catalog.data) && typeof catalog.data.id === 'string' && typeof catalog.data.description === 'string' && Array.isArray(catalog.data.links)) {
          this.accessPrivate = false;
          console.log(catalog.data);
          if (typeof catalog.data.title === 'string' && !this.title) {
            this.title = catalog.data.title;
          }
          if (typeof catalog.data.description === 'string' && !this.summary) {
            this.summary = catalog.data.description;
          }
          this.urlHint = "Catalog found. Inserting some data from the catalog for you...";
          this.urlHintType = "success";
        }
        else {
          this.urlHint = "The link provided doesn't seem to be a valid catalog. Are you sure the URL is correct? Is the catalog private? Setting the API as 'private' for you...";
          this.urlHintType = "danger";
        }
      }
    },
    type(newVal) {
      if (newVal) {
        this.confirmation = null;
        this.error = null;
      }
    },
    title(val) {
      if (!this.customSlug) {
        this.slug = slugify(val, {
          lower: true,
          strict: true
        });
      }
    }
  },
  computed: {
    proxyUrl() {
      return this.$axios.defaults.baseURL + '/proxy?';
    },
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
      let fields = ['url', 'title', 'summary', 'email'];
      if (this.type === 'catalog' || this.type === 'api') {
        fields.push('slug');
        fields.push('private');
      }
      else if (this.type === 'ecosystem') {
        fields.push('language');
        fields.push('categories');
      }
      return fields;
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/languages');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for languages is not an array");
      }
      this.languageList = response.data;
    } catch (error) {
      console.error("Can't load list of programming languages.");
    }
    try {
      let response = await this.$axios.get('/categories');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for categories is not an array");
      }
      this.categoryList = response.data;
    } catch (error) {
      console.error("Can't load list of categories.");
    }
  },
  methods: {
    stopSlugGen() {
      this.customSlug = true;
    },
    reset() {
      this.type = null;
      this.url = null;
      this.title = null;
      this.summary = null;
      this.language = null,
      this.categories = [];
      this.accessPrivate = false;
      this.access = null;
      this.email = null;
      this.customSlug = false;
    },
    async onSubmit(evt) {
      evt.preventDefault();
      try {
        await this.$axios.post('/add', this.getData());
        this.error = null;
        this.confirmation = "Thank you for your contribution. The data was stored successfully and should be available in the index within a day.";
        this.reset();
      } catch (error) {
        this.confirmation = null;
        this.error = error.response.data;
      }
    },
    getData() {
      return {
        type: this.type,
        url: this.url,
        slug: this.slug,
        title: this.title,
        summary: this.summary,
        language: this.language,
        categories: this.categories,
        access: this.access,
        email: this.email
      };
    }
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>