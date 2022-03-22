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
const provider = new providers.JsonRpcProvider(
  "https://rpc.testnet.near.org"
)
import { initContract } from "@/nearConfig"

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
    meta: { title: 'Do[NFT]', requiresAuth: true },
  },
  {
    path: '/add_effect/:id/confirm/:effectId',
    name: 'AddEffectConfirm',
    component: AddEffectConfirm,
    meta: { title: 'Do[NFT]', requiresAuth: true }
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

async function passResult(txHash, accountId, type) {
  const result = await provider.txStatus(txHash, accountId)

  console.log(result, 'tx HASH result')
  if (result.status && 'SuccessValue' in result.status && type === 'send_nft') {
    console.log("Result: 2 ", result)
    store.dispatch('setStatus', StatusType.Approved)
  }

  if (result.status && 'SuccessValue' in result.status && ['SendNFT', 'CreateNFT'].includes(type)) {
    console.log("Result: 2 ", result)
    store.dispatch('setStatus', StatusType.Minted)
  }
}


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
    console.log('CONTRACT INIT')
    await initContract(store)
      .then(() => {
        const user = store.getters.getCurrentWallet.isSignedIn()
        if (!user) {
          router.push('/login')
        }
        store.dispatch('setContractLoading', false)
      })
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  let user = null
  if (store.getters.getCurrentWallet) {
    user = store.getters.getCurrentWallet.isSignedIn()
  }

  // todo: do not triggering, because beforeEach trigger earlier than contract initialize
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

  // handling transaction hashes, for displayng response to user
  const account_id = store.getters.getAccountId
  const url = new URL(document.location)
  const tx_hash = url.searchParams.get('transactionHashes')

  let result = null
  let isApproveCalled = false

  if (tx_hash) {
    result = await provider.txStatus(tx_hash, account_id)
  }

  // may be need rework, current checking for disabling redirect on NFT approving
  if (result && result.transaction.actions[0] && result.transaction.actions[0].FunctionCall) {
    isApproveCalled = result.transaction.actions[0].FunctionCall.method_name === 'nft_approve'
  }

  if (tx_hash && to.name === 'SendNFT') {
    passResult(tx_hash, account_id, to.name)
    router.push({ name: 'SendNFT' })
  }

  if (!isApproveCalled && tx_hash && ['ChooseNFT', 'BundleNFT', 'NFTDetails', 'CreateNFT', 'AddEffect', 'AddEffectConfirm'].includes(to.name)) {
    router.push({ name: 'ChooseNFT' })
    passResult(tx_hash, account_id, to.name)
  } else {
    next()
  }
})

export default router