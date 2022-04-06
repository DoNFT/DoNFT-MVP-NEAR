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
import store from "@/store"
import { StatusType } from "@/utilities"

import { providers } from "near-api-js"
import { initContract } from "@/nearConfig"
import { AppError } from "@/utilities"

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

  // if (isApproveCalled && to.name === 'AddEffectConfirm') {
  //   console.log('beforeEnter AddEffectConfirm')
  //   passResult(tx_hash, account_id, to.name)
  //   next({ name: 'AddEffectConfirm' })
  // }

  if (!isApproveCalled && tx_hash && ['ChooseNFT', 'BundleNFT', 'NFTDetails', 'CreateNFT', 'AddEffectConfirm', 'SendNFT'].includes(to.name)) {
    passResult(tx_hash, account_id, to.name)
    isRedirected = true
    next({ name: 'ChooseNFT' })
  } else {
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
router.beforeEach(async (to, _from, next) => {

  if (!store.getters.getCurrentWallet) {
    console.log('---CONTRACT INIT---')
    try {
      await initContract(store)
        .then(() => {
          const user = store.getters.getCurrentWallet.isSignedIn()
          if (!user) {
            router.push('/login')
          }
          store.commit('SET_CURRENT_CONTRACT_LOADING', false)
        })
    } catch(err) {
      if(err instanceof AppError) {
        alert(err.message)
      }
      else {
        console.log(err)
        alert("Undefined error")
      }
  
    }
  }
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  let user = null

  if (store.getters.getCurrentWallet) {
    user = store.getters.getCurrentWallet.isSignedIn()
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