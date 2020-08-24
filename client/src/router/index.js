import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

function toBoolean(str) {
  switch(str) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return null;
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import(/* webpackChunkName: "collections" */ '../views/Collections.vue'),
    props: route => ({ access: toBoolean(route.query.access) })
  },
  {
    path: '/apis',
    name: 'APIs',
    component: () => import(/* webpackChunkName: "apis" */ '../views/APIs.vue'),
    props: route => ({ access: toBoolean(route.query.access) })
  },
  {
    path: '/ecosystem',
    name: 'Ecosystem',
    component: () => import(/* webpackChunkName: "ecosystem" */ '../views/Ecosystem.vue'),
    props: route => ({ category: route.query.category, language: route.query.language })
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import(/* webpackChunkName: "add" */ '../views/Add.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import(/* webpackChunkName: "contact" */ '../views/Contact.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy Policy',
    component: () => import(/* webpackChunkName: "privacy" */ '../views/Privacy.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
