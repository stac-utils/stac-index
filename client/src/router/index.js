import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import NotFound from '../views/NotFound.vue'

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
    path: '/collections/:id',
    name: 'Browse',
    component: () => import(/* webpackChunkName: "browse" */ '../views/Browse.vue'),
    props: route => ({ id: route.params.id })
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
  },
  {
    path: '*',
    component: NotFound
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  if (to.name) {
    document.title = to.name + " - STAC Index"
  }
  else {
    document.title = "STAC Index"
  }
  next()
})

export default router
