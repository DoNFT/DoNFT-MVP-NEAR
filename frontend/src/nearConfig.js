import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js'
import { getConfig } from './nearNets'

const nfts_contract = getConfig({ env: process.env.NODE_ENV, contract: process.env.VUE_APP_NFTS_CONTRACT })
const bundle_contract = getConfig({ env: process.env.NODE_ENV, contract: process.env.VUE_APP_BUNDLE_CONTRACT })
// const nearConfig_bundle = getConfig({ env: process.env.NODE_ENV, contract: bundle_contract })
// console.log(nearConfig_bundle, 'nearConfig_bundle 111')

// Initialize contract & set global variables
export async function initContract(store) {
  store.dispatch('setContractLoading', true)
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nfts_contract))

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  const walletConnection = new WalletConnection(near)
  store.dispatch('setNearWalletConnection', walletConnection)
  store.dispatch('setAccountId', walletConnection.getAccountId())

  const domain = `${nfts_contract.helperUrl}/account/${store.getters.getAccountId}/likelyNFTs`
  
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
      console.log(err, 'accountContracts err')
    }

    return tokens
  }
  const NFTsContracts = await getTokens(store.getters.getAccountId, 50)

  let acc = []

  if (store.getters.getAccountId) {
    acc = await near.account(store.getters.getAccountId)

    const balance = await acc.getAccountBalance()
    const amountInNEAR = utils.format.formatNearAmount(balance.total)
    store.dispatch('setNearBalance', amountInNEAR)
    store.dispatch('setNearAccount', acc)
  }

  await NFTsContracts.forEach(async (contract, key) => {
    let request = null

    try {
      request = await acc.viewFunction(contract, 'nft_tokens_for_owner', { account_id: store.getters.getAccountId, limit: 30 })
    } catch(err) {
      console.log(err, 'accountContracts err')
    }

    let obj = {}

    const mainContracts = [nfts_contract.contractName, bundle_contract.contractName]

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
  })

  // Initializing our contract APIs by contract name and configuration
  const cotractSettings = await new Contract(walletConnection.account(), nfts_contract.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['nft_total_supply', 'nft_supply_for_owner', 'nft_metadata', 'nft_token', 'nft_tokens_for_owner', 'nft_tokens'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['nft_mint', 'nft_transfer', 'nft_transfer_call', 'nft_approve', 'nft_burn', 'nft_bundle', 'nft_unbundle'],
  })
  store.dispatch('setCurrentContract', cotractSettings)

  // near BUNDLE contract
  const near_bundle = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, bundle_contract))
  const walletBundleConnection = new WalletConnection(near_bundle)
  const acc_bundle = await near_bundle.account(walletBundleConnection.getAccountId())
  console.log(acc_bundle, 'aacc bundle')

  // Initializing our contract APIs by contract name and configuration
  const cotractBundleSettings = await new Contract(walletBundleConnection.account(), bundle_contract.contractName, {
    changeMethods: ['nft_bundle', 'nft_unbundle'],
  })
  store.dispatch('setCurrentBundleContract', cotractBundleSettings)

}

export function logout(getCurrentWallet) {
  getCurrentWallet.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login(getCurrentWallet) {
  getCurrentWallet.requestSignIn(nfts_contract.contractName)
}
