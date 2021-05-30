import Vue from 'vue'
import App from './App.vue';
import router from './router';
import axios from 'axios';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import { HTTPS, HTTP_HOST, HTTP_PORT, HTTP_PATH } from '../../commons';

const URL = (HTTPS ? 'https://' : 'http://') + HTTP_HOST + (!HTTPS && HTTP_PORT != 80 ? ':' + HTTP_PORT : '') + HTTP_PATH;

Vue.config.productionTip = false;

Vue.prototype.$axios = axios.create({
  baseURL: URL,
  timeout: 10000,
});

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

new Vue({
  router,
  render: h => h(App)
}).$mount('#stac-index');