import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import(/* webpackChunkName: "collections" */ '../views/Collections.vue')
  },
  {
    path: '/apis',
    name: 'APIs',
    component: () => import(/* webpackChunkName: "apis" */ '../views/APIs.vue')
  },
  {
    path: '/ecosystem',
    name: 'Ecosystem',
    component: () => import(/* webpackChunkName: "ecosystem" */ '../views/Ecosystem.vue')
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import(/* webpackChunkName: "add" */ '../views/Add.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
