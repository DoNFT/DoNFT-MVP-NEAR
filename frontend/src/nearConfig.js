import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js'
import { getConfig } from './nearNets'
import { SystemErrors } from "@/utilities"

const nfts_contract = getConfig({ env: process.env.VUE_APP_NETWORK, contract: process.env.VUE_APP_NFTS_CONTRACT })
const bundle_contract = getConfig({ env: process.env.VUE_APP_NETWORK, contract: process.env.VUE_APP_BUNDLE_CONTRACT })
const nfts_effects_contract = getConfig({ env: process.env.VUE_APP_NETWORK, contract: process.env.VUE_APP_NFTS_EFFECTS_CONTRACT })
const collection_factory = getConfig({ env: process.env.VUE_APP_NETWORK, contract: process.env.VUE_APP_COLLECTION_FACTORY })

// Initialize contract & set global variables
export async function initContract(store) {
  store.commit('SET_CURRENT_CONTRACT_LOADING', true)
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nfts_contract))

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  const walletConnection = new WalletConnection(near)
  console.log(walletConnection, 'walletConnection')
  store.dispatch('setNearWalletConnection', walletConnection)
  store.dispatch('setAccountId', walletConnection.getAccountId())

  const domain = `https://testnet-api.kitwallet.app/account/${store.getters.getAccountId}/likelyNFTs`
  
  const headers = new Headers({
    'max-age': '300'
  })
  
  // getting all contracts of current account by NEAR helper url
  const getTokens = async () => {
    const url = domain
    let tokens = []
    try {
      tokens = await fetch(url, { headers }).then((res) => res.json())
    } catch(err) {
      console.log(err)
      throw SystemErrors.GET_NEAR_NFTS
    }

    return tokens
  }
  let NFTsContracts = []

  let acc = []

  console.log(nfts_contract, 'nfts_contract')
  if (store.getters.getAccountId) {
    acc = await near.account(store.getters.getAccountId)
    NFTsContracts = await getTokens(store.getters.getAccountId, 50)

    console.log(NFTsContracts, 'NFTsContracts')
    const balance = await acc.getAccountBalance()
    const amountInNEAR = utils.format.formatNearAmount(balance.total)
    store.dispatch('setNearBalance', amountInNEAR)
    store.dispatch('setNearAccount', acc)
  }

  await Promise.all(NFTsContracts.map(async (contract, key) => {
    let request = []

    try {
      request = await acc.viewFunction(contract, 'nft_tokens_for_owner', { account_id: store.getters.getAccountId, limit: 30 })
    } catch(err) {
      console.log(err, 'err')
    }
    console.log(request, 'request')
    console.log(contract, 'contract')

    let obj = {}

    const mainContracts = [nfts_contract.contractName, bundle_contract.contractName, nfts_effects_contract.contractName]

    // contract order changing, show main contracts on top. others lower
    if (mainContracts.includes(contract)) {
      obj = {
        contractName: contract,
        NFTS: request,
        id: key,
      }
    } else {
      obj = {
        contractName: contract,
        NFTS: request,
        id: key + 100,
      }
    }
    store.dispatch('pushNFTbyContract', obj)

    if (request) {
      store.dispatch('setNFTsCounter', request.length)
    }

    return request
  }))

  // Initializing our contract APIs by contract name and configuration
  const cotractSettings = await new Contract(walletConnection.account(), nfts_contract.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['nft_total_supply', 'nft_tokens_for_owner', 'nft_tokens'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_bundle', 'nft_unbundle', 'multiple_nft_approve'],
  })
  store.dispatch('setCurrentContract', cotractSettings)

  // near BUNDLE contract
  // --------------------
  // near BUNDLE contract
  const near_bundle = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, bundle_contract))
  const walletBundleConnection = new WalletConnection(near_bundle)

  // Initializing our contract APIs by contract name and configuration
  const cotractBundleSettings = await new Contract(walletBundleConnection.account(), bundle_contract.contractName, {
    changeMethods: ['nft_mint', 'nft_bundle', 'nft_unbundle', 'nft_approve', 'nft_transfer', 'nft_bundle_with_approve'],
    viewMethods: ['nft_tokens', 'nft_total_supply']
  })
  store.dispatch('setCurrentBundleContract', cotractBundleSettings)
  
  // near NFT EFFECTS contract
  // --------------------
  // near NFT EFFECTS contract
  const near_nft_effects = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nfts_effects_contract))
  const nftEffectsWallet = new WalletConnection(near_nft_effects)

  // Initializing our contract APIs by contract name and configuration
  const cotractEffectsSettings = await new Contract(nftEffectsWallet.account(), nfts_effects_contract.contractName, {
    changeMethods: ['nft_mint', 'nft_bundle', 'nft_unbundle', 'nft_approve', 'nft_transfer'],
  })
  store.dispatch('setCurrentEffectsContract', cotractEffectsSettings)

  // near COLLECTION FACTORY contract
  // --------------------
  // near COLLECTION FACTORY contract
  const near_collection_factory = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, collection_factory))
  const collectionFactory = new WalletConnection(near_collection_factory)

  // Initializing our contract APIs by contract name and configuration
  const contractCollectionFactory = await new Contract(collectionFactory.account(), collection_factory.contractName, {
    changeMethods: ['create_store'],
    viewMethods: ['get_stores_collection', 'check_contains_store'],
  })
  store.commit('SET_COLLECTION_FACTORY_CONTRACT', contractCollectionFactory)

  if (collectionFactory.getAccountId()) {
    const collections = await contractCollectionFactory
      .get_stores_collection({
        account_id: collectionFactory.getAccountId(),
      })
    store.commit('SET_USER_COLLECTIONS', collections)
  }
}

// for ALL other extra Contracts, its need to use Change methods
// cause Near require at least login, or init of contract, for using change methods
export async function initNewContract(mintingContract) {
  const contractConfig = getConfig({ env: process.env.VUE_APP_NETWORK, contract: mintingContract})
  console.log(contractConfig, 'config')
  const nearConnectInstance = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, contractConfig))
  console.log(nearConnectInstance, 'nearConnectInstance')
  const nearNewWallet = new WalletConnection(nearConnectInstance)
  console.log(nearNewWallet, 'nearNewWallet')
  const nearNewContractSettings = new Contract(nearNewWallet.account(), contractConfig.contractName, {
    changeMethods: ['nft_mint', 'nft_bundle', 'nft_unbundle', 'nft_approve', 'nft_transfer', 'nft_tokens_for_owner'],
  })
  console.log(nearNewContractSettings, 'nearNewContractSettings')
  return nearNewContractSettings
}

export function logout(getCurrentWallet) {
  getCurrentWallet.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login(getCurrentWallet) {
  getCurrentWallet.requestSignIn()
}

export function loginFullAccess(getCurrentWallet, fullAccessAcc) {
  console.log(getCurrentWallet, fullAccessAcc, 'loginFullAccess')
  getCurrentWallet.requestSignIn(fullAccessAcc)
}

