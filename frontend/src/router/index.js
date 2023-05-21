import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/views/Login'
import ChooseNFT from "@/views/ChooseNFT"
import SendNFT from "@/views/SendNFT"
import CreateNFT from "@/views/CreateNFT"
import BundleNFT from "@/views/BundleNFT"
import AddEffect from "@/views/AddEffect"
import AddEffectConfirm from "@/views/AddEffectConfirm"
import NFTDetails from "@/views/NFTDetails"
import DeployContract from "@/views/DeployContract"
import DataEditor from "@/views/DataEditor"
import AdminEffects from "@/views/admin/AdminEffects"

import store from "@/store"
import { StatusType } from "@/utilities"

import { providers } from "near-api-js"
import { initContract } from "@/nearConfig"

const provider = new providers.JsonRpcProvider(
  "https://rpc.testnet.near.org"
)

async function getTransactionForUser(to, next) {
  // handling transaction hashes, for displayng response to user
  const account_id = store.getters.getAccountId
  const url = new URL(document.location)
  const tx_hash = url.searchParams.get('transactionHashes')

  let result = null
  let isApproveCalled = false
  let isRedirected = false

  if (tx_hash) {
    result = await provider.txStatus(tx_hash, account_id)
  }

  // may be need rework, current checking for disabling redirect on NFT approving
  if (result && result.transaction.actions[0] && result.transaction.actions[0].FunctionCall) {
    isApproveCalled = result.transaction.actions[0].FunctionCall.method_name === 'nft_approve'
  }

  if (isApproveCalled) {
    passResult(tx_hash, account_id, 'Approve')
    next()
  }

  // all routers, which gonna be redirected to chooseNFT in case of successful transaction
  if (!isApproveCalled && tx_hash && ['ChooseNFT', 'BundleNFT', 'NFTDetails', 'CreateNFT', 'AddEffectConfirm', 'SendNFT'].includes(to.name)) {
    passResult(tx_hash, account_id, to.name)
    isRedirected = true
    next({ name: 'ChooseNFT' })
  } else {
    // setting  FULL access key in storage, to understand
    // is current user got FULL access or restricted
    if (["DeployContract"].includes(to.name) && 'public_key' in router.currentRoute.query) {
      sessionStorage.setItem("near_access_key", router.currentRoute.query.public_key)
      next()
    }

    if (!["AddEffect", "AddEffectConfirm"].includes(to.name)) {
      next({ name: to.name })
    }

    next()
  }

  // for specific cases, in beforeEnter, when no transaction, although need some kind of validations
  return isRedirected
}

async function passResult(txHash, accountId, type) {
  const result = await provider.txStatus(txHash, accountId)
  if (result.status && 'SuccessValue' in result.status && ['Approve'].includes(type)) {
    store.dispatch('setStatus', StatusType.Approved)
  }

  if (result.status && 'SuccessValue' in result.status && ['SendNFT', 'CreateNFT', 'BundleNFT'].includes(type)) {
    store.dispatch('setStatus', StatusType.Minted)
  }
}


Vue.use(Router)

let routes = [
  {
    path: '/',
    name: 'Home',
    meta: { title: 'Do[NFT]' },
    redirect: { name: 'ChooseNFT' },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'Do[NFT]' },
  },
  {
    path: '/choose_nft',
    name: 'ChooseNFT',
    component: ChooseNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/create_nft',
    name: 'CreateNFT',
    component: CreateNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/bundle_nft',
    name: 'BundleNFT',
    component: BundleNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/admin/effects',
    name: 'AdminEffects',
    component: AdminEffects,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/add_effect/:id',
    name: 'AddEffect',
    component: AddEffect,
    meta: {
      title: 'Do[NFT]',
      requiresAuth: true
    },
    beforeEnter(to, _from, next) {
      const NFTChoice = store.getters.getAllNFTs.find(x => x.token_id === to.params.id)
    
      if (to.name === 'AddEffect' && !NFTChoice) {
        next('/choose_nft')
        Vue.notify({
          group: 'foo',
          type: 'error',
          title: 'Important message',
          text: `Sorry, NFT with ID ${to.params.id} does not exit`,
        })
      } else {
        next()
      }
    },
  },
  {
    path: '/add_effect/:id/confirm/:effectId',
    name: 'AddEffectConfirm',
    component: AddEffectConfirm,
    meta: {
      title: 'Do[NFT]',
      requiresAuth: true
    },
    async beforeEnter(to, _from, next) {
      const effectChoice = store.getters.getAllNFTs.find(x => x.token_id === to.params.effectId)

      const isRedirected = await getTransactionForUser(to, next)
    
      if (to.name === 'AddEffectConfirm' && !effectChoice && !isRedirected) {
        next(`/add_effect/${to.params.id}`)
        Vue.notify({
          group: 'foo',
          type: 'error',
          title: 'Important message',
          text: `Sorry, effect with ID ${to.params.effectId} does not exit`,
        })
      } else {
        next(`/add_effect/${to.params.id}/confirm/${to.params.effectId}`)
      }
    },
  },
  {
    path: '/nft_details/:id',
    name: 'NFTDetails',
    component: NFTDetails,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/send_nft/:id',
    name: 'SendNFT',
    component: SendNFT,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/deploy',
    name: 'DeployContract',
    component: DeployContract,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
  {
    path: '/editor',
    name: 'DataEditor',
    component: DataEditor,
    meta: { title: 'Do[NFT]', requiresAuth: true }
  },
]

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.afterEach(async (to, from) => {
  Vue.nextTick(() => {
    from
    document.title = to.meta.title || process.env.NAME
  })
})

// MOVED NEAR config to here, because need to await login data of USER
// in this case, loader is showing, and we are awaiting near config resolve

// checking for auth require, depend on it, going to next route
router.beforeEach(async (to, from, next) => {

  if (!store.getters.getCurrentWallet) {
    console.log('---CONTRACT INIT---')
    await initContract(store)
      .then(() => {
        const user = store.getters.getCurrentWallet.isSignedIn()
        if (!user) {
          router.push('/login')
        }
        store.commit('SET_CURRENT_CONTRACT_LOADING', false)
      })
  }
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  let user = null

  if (store.getters.getCurrentWallet) {
    user = store.getters.getCurrentWallet.isSignedIn()
  }

  // todo: need to pay more attention on keys management
  // current problem in Deploy page, where we give full access to user
  // it should be removed once its used, cause logic while full access different
  // near do not redirect to near wallet
  if (from.name === 'DeployContract' && !('public_key' in router.currentRoute.query) && store.getters.getContract) {
    const localKey = `near-api-js:keystore:${store.getters.getContract.account.accountId}:testnet`
    
    if (localStorage.getItem(localKey)) {
      const key = sessionStorage.getItem('near_access_key')
      store.getters.getNearAccount.deleteKey(key)
      sessionStorage.removeItem('near_access_key')
      localStorage.removeItem(localKey)
    }
  }

  if (store.getters.getContract && requiresAuth && !user) {
    next('/login')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: 'Please Sign in first',
    })
  } else {
    next()
  }

  if (to.name !== 'AddEffectConfirm') {
    getTransactionForUser(to, next)
  }
})

export default router