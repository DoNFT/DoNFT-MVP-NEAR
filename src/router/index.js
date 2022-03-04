import Vue from 'vue'
import Router from 'vue-router'
import Home from '../views/Home'
import ChooseNFT from "../views/ChooseNFT"
import SendNFT from "../views/SendNFT"
// import ChooseEffect from "../views/ChooseEffect"
// import Minting from "../views/Minting"
// import WrapNFTS from "../views/WrapNFTS"
// import Unwrap from "../views/Unwrap"

Vue.use(Router)

let routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'Do[NFT]' }
  },
  {
    path: '/choose_nft',
    name: 'ChooseNFT',
    component: ChooseNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/send_nft',
    name: 'SendNFT',
    component: SendNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
//   {
//     path: '/wrap',
//     name: 'WrapNFTS',
//     component: WrapNFTS,
//     meta: { title: 'Do[NFT]' }
//   },
//   {
//     path: '/unwrap',
//     name: 'Unwrap',
//     component: Unwrap,
//     meta: { title: 'Do[NFT]' }
//   }
]

// if (process.env.VUE_APP_EFFECTS_ENABLED === 'true') {
//   routes.push(...[
//     {
//       path: '/choose_modification',
//       name: 'ChooseEffect',
//       component: ChooseEffect,
//       meta: { title: 'Do[NFT]' }
//     },
//     {
//       path: '/mint',
//       name: 'Minting',
//       component: Minting,
//       meta: { title: 'Do[NFT]' }
//     },
//   ])
// }

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.afterEach((to, from) => {
  // Use next tick to handle router history correctly
  // see: https://github.com/vuejs/vue-router/issues/914#issuecomment-384477609
  Vue.nextTick(() => {
    from
    document.title = to.meta.title || process.env.NAME
  })
})



router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const user = window.walletConnection.isSignedIn()
  console.log(user, 'user')
  if (requiresAuth && !user) {
    next('/')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: 'Please Sign in first',
    })
  } else {
    next()
  }
})

export default router