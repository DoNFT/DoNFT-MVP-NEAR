import Vue from 'vue'
import Vuex from 'vuex'

import {
  deployNFTtoIPFS,
  approveNFT,
  createUsualNFT,
  createBundleNFT,
  getOwnerNFTs,
  bundleWithApprove,
  unbundleNFT,
  sendNFT,
  getImageForTokenByURI,
  checkForContract,
  removeTokenFromBundle,
  addTokenToBundle,
  addNewEffectContract,
  removeEffectContract,
  nftRevoke,
  bundleMetaUpdate,
} from "@/near_utilities"

import {StatusType, getIPFS} from "@/utilities"
import {modifyPicture, applyNFTsEffect} from "@/api"
import {SystemErrors, AppError} from "@/utilities"

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    ipfs: null,
    accountBalance: null,
    allNFTs: [],
    NFTsTotal: 0,
    NFTsByContract: [],
    nftChoice: [],
    nftLoading: false,
    contractLoading: false,
    account_id: null,
    effectChoice: null,
    deployedPictureMeta: null,
    nftTransactionHash: null,
    globalLoading: false,
    imageResult: null,
    NFTdata: null,
    arrayNFTs: null,
    NFTlimit: 15,
    status: StatusType.ChoosingParameters,
    wallet: null,
    balance: null,
    effectModalStatus: false,
    droppedImage: null,
    nearAccount: null,
    contract: null,
    effects_list_contract: null,
    bundle_contract: null,
    effects_contract: null,
    factory_contract: null,
    activeContract: 'nft-list.near_testing.testnet',
    user_stores_collection: [],
    mainContracts: [
      process.env.VUE_APP_NFTS_CONTRACT,
      process.env.VUE_APP_NFTS_EFFECTS_CONTRACT,
      process.env.VUE_APP_BUNDLE_CONTRACT,
      process.env.VUE_APP_EFFECTS_WATCHER_CONTRACT,
    ],
  },
  mutations: {
    setIpfs (state, ipfsInstance) {
      state.ipfs = ipfsInstance
    },
    setAccountAddress (state, accountAddress) {
      state.accountAddress = accountAddress
    },
    setEffectChoice(state, choice) {
      state.effectChoice = choice
    },
    setImageResult (state, blob) {
      state.imageResult = blob
    },
    setNFTsLoading (state, blob) {
      state.nftLoading = blob
    },
    SET_DEPLOYED_PICTURE_META (state, meta) {
      state.deployedPictureMeta = meta
    },
    setNFThash (state, transactionHash) {
      state.nftTransactionHash = transactionHash
    },
    setStatus (state, status) {
      state.status = status
    },
    passAllNFTs (state, payload) {
      state.allNFTs = payload
    },
    setNFT (state, payload) {
      state.NFTdata = payload
    },
    setNFTArray (state, payload) {
      state.arrayNFTs = payload
    },
    NFT_REVOKE(state, { token_id, account_id }) {
      state.status = StatusType.Minting
      nftRevoke(token_id, account_id, state.bundle_contract)
    },
    BUNDLE_META_UPDATE(state, { token_id, metadata }) {
      state.status = StatusType.Minting
      bundleMetaUpdate(token_id, metadata, state.bundle_contract)
    },
    REMOVE_TOKEN_FROM_BUNDLE(state, { remove_token_data, bundle_id }) {
      removeTokenFromBundle(state.bundle_contract, remove_token_data, bundle_id)
    },
    CREATE_NEW_BUNDLE_WITH_APPROVE(state, { tokens_for_approve, account_for_approve, contract_of_tokens, token_id, metadata, bundles }) {
      state.status = StatusType.Minting
      bundleWithApprove(tokens_for_approve, account_for_approve, contract_of_tokens, token_id, metadata, bundles, state.account_id, state.bundle_contract)
    },
    SET_CURRENT_CONTRACT_NFT (state, payload) {
      // this one for main page rendering, contract separated data
      state.NFTsByContract.push(payload)

      const NFTsWithContract = payload.NFTS.map((item) => ({ ...item, contract: payload.contractName }))

      // this one, for details pages rendering purposes
      state.allNFTs.push.apply(state.allNFTs, NFTsWithContract)
    },
    SET_NFT_LIMIT (state, payload) {
      state.NFTlimit = payload
    },
    SET_CURRENT_CONTRACT_LOADING (state, payload) {
      state.contractLoading = payload
    },
    SET_CURRENT_CONTRACT (state, payload) {
      state.contract = payload
    },
    SET_CURRENT_WALLET (state, payload) {
      state.wallet = payload
    },
    SET_ACCOUNT_ID (state, payload) {
      state.account_id = payload
    },
    SET_CURRENT_BALANCE (state, payload) {
      state.balance = payload
    },
    // contract with special methods for storing data about effects
    SET_EFFECTS_LIST_CONTRACT(state, payload) {
      state.effects_list_contract = payload
    },
    SET_CURRENT_BUNDLE_CONTRACT (state, payload) {
      state.bundle_contract = payload
    },
    SET_CURRENT_EFFECTS_CONTRACT (state, payload) {
      state.effects_contract = payload
    },
    SET_COLLECTION_FACTORY_CONTRACT (state, payload) {
      state.factory_contract = payload
    },
    SET_USER_COLLECTIONS (state, payload) {
      state.user_stores_collection = payload
    },
    SET_NFT_COUNTER (state, payload) {
      state.NFTsTotal += payload
    },
    SET_EFFECT_MODAL (state, payload) {
      state.effectModalStatus = payload
    },
    SET_DROPPED_IMAGE (state, payload) {
      state.droppedImage = payload
    },
    SET_NEAR_ACCOUNT (state, payload) {
      state.nearAccount = payload
    },
    SET_ACTIVE_CONTRACT (state, payload) {
      state.activeContract = payload
    },
  },
  actions: {
    passNFTlimit ({commit}, data) {
      commit('SET_NFT_LIMIT', data)
    },
    passNFT ({commit}, data) {
      commit('setNFT', data)
    },
    passChosenTokens ({commit}, data) {
      sessionStorage.setItem("tokens_id", data)
      commit('setNFTArray', data)
    },
    setEffectChoice ({commit}, choice) {
      commit('setEffectChoice', choice)
    },
    setStatus ({commit}, status) {
      commit("setStatus", status)
    },
    async addNFTtoBundle({getters}, { token_to_add_data, tokens_to_approve, bundle_token_id, contractId, owner_id }) {
      const contractData = await checkForContract(getters, contractId || process.env.VUE_APP_BUNDLE_CONTRACT)
      console.log(contractData, 'contractData')

      addTokenToBundle(contractData, token_to_add_data, tokens_to_approve, bundle_token_id, owner_id)
    },
    async setIpfs ({commit}) {
      const ipfs = await getIPFS()
      commit('setIpfs', await ipfs.create())
    },
    async setResult ({commit, dispatch, getters}, type) {
      try {
        if (type === "base64") {
          commit('setImageResult', getters.getNFTforModification.media)
        } else {
          commit('setImageResult', await modifyPicture(getters.getNFTforModification.media, getters.getEffectChoice))
        }
      } catch(err) {
        dispatch('setStatus', StatusType.ChoosingParameters)

        if (err instanceof AppError) {
          throw err
        } else {
          throw SystemErrors.NFT_EFFECT_CONFIRM
        }
      }
    },
    async setEffectResult ({commit, dispatch}, effectData) {
      try {
        dispatch('setStatus', StatusType.Applying)
        commit('SET_DEPLOYED_PICTURE_META', await applyNFTsEffect(effectData))
        dispatch('setStatus', StatusType.ChoosingParameters)
      } catch(err) {
        dispatch('setStatus', StatusType.ChoosingParameters)

        if (err instanceof AppError) {
          throw err
        } else {
          throw SystemErrors.NFT_EFFECT_CONFIRM
        }
      }
    },
    async setDeployedPictureMeta ({commit, dispatch, getters}, type) {
      try {
        dispatch('setStatus', StatusType.DeployingToIPFS)
        commit('SET_DEPLOYED_PICTURE_META', await deployNFTtoIPFS(getters.getIpfs, getters.getResult, getters.getNFTforModification, type))
      } catch(err) {
        dispatch('setStatus', StatusType.ChoosingParameters)

        if(err instanceof AppError) {
          alert(err.message)
        } else {
          console.log(err)
          alert("Undefined error")
        }
      }
    },
    async setTokenImage ({getters}, token) {
      let url = null

      if (getters.getIpfs) {
        url = await getImageForTokenByURI(getters.getIpfs, token.metadata.media)
      }

      return url
    },
    async getIPFSimage ({getters}, media) {
      let url = null
      if (getters.getIpfs) {
        url = await getImageForTokenByURI(getters.getIpfs, media)
      }
      return url
    },
    async removeFromList ({getters}, contract_id) {
      try {
        const contractData = await checkForContract(getters, process.env.VUE_APP_EFFECTS_WATCHER_CONTRACT)
        console.log(contract_id, 'addEffectToList effect_data')
        await removeEffectContract(contract_id, contractData)
      } catch(err) {
        console.log(err)
        throw SystemErrors.MINT_NFT
      }
    },
    async addEffectToList ({getters}, effect_data) {
      try {
        const contractData = await checkForContract(getters, process.env.VUE_APP_EFFECTS_WATCHER_CONTRACT)
        console.log(effect_data, 'addEffectToList effect_data')
        await addNewEffectContract(effect_data, contractData)
      } catch(err) {
        console.log(err)
        throw SystemErrors.MINT_NFT
      }
    },
    async createNewUsualNFT ({getters, dispatch},  { token_id, metadata, contract_id }) {
      try {
        dispatch('setStatus', StatusType.Minting)
        const contractData = await checkForContract(getters, contract_id)
        await createUsualNFT(token_id, metadata, getters.getAccountId, contractData)
      } catch(err) {
        console.log(err)
        throw SystemErrors.MINT_NFT
      }
    },
    createNewBundleNFT ({getters, dispatch},  { token_id, metadata, bundles }) {
      dispatch('setStatus', StatusType.Minting)
      createBundleNFT(token_id, metadata, bundles, getters.getAccountId, getters.getBundleContract)
    },
    async triggerUnbundleNFT ({getters, dispatch},  { token_id, contract_id }) {
      try {
        const contractData = await checkForContract(getters, contract_id)

        dispatch('setStatus', StatusType.Unbundling)
        await unbundleNFT(token_id,contractData)
      } catch(err) {
        dispatch('setStatus', StatusType.ChoosingParameters)

        console.log(err)
        throw SystemErrors.UNBUNDLE_NFTS
      }
    },
    async setNFTApproveId ({getters, dispatch}, { approve_id, token_id, minting_contract_id }) {
      let contractData = await checkForContract(getters, minting_contract_id)

      dispatch('setStatus', StatusType.Approving)
      await approveNFT(approve_id, token_id, contractData)
    },
    async sendNFTByToken ({getters, dispatch}, { receiver, token_data, minting_contract_id }) {
      dispatch('setStatus', StatusType.Approving)
      let contractData = await checkForContract(getters, minting_contract_id)

      await sendNFT(receiver, token_data, contractData)
    },
    async fetchOwnerNFTs({ getters }, { account, nftContract }) {
      console.log(account, nftContract, 'fetchOwnerNFTs')
      let contractData = await checkForContract(getters, nftContract)
      console.log(contractData, 'contractData')
      getOwnerNFTs(account, contractData)
    },
    pushNFTbyContract ({commit}, NFTS) {
      commit('SET_CURRENT_CONTRACT_NFT', NFTS)
    },
    setEffectModal ({commit}, data) {
      commit('SET_EFFECT_MODAL', data)
    },
    setDroppedImage ({commit}, data) {
      commit('SET_DROPPED_IMAGE', data)
    },
    // NEAR config settings
    setCurrentContract ({commit}, contract) {
      commit('SET_CURRENT_CONTRACT', contract)
    },
    setCurrentBundleContract ({commit}, contract) {
      commit('SET_CURRENT_BUNDLE_CONTRACT', contract)
    },
    setCurrentEffectsContract ({commit}, contract) {
      commit('SET_CURRENT_EFFECTS_CONTRACT', contract)
    },
    setNearWalletConnection ({commit}, wallet) {
      commit('SET_CURRENT_WALLET', wallet)
    },
    setAccountId ({commit}, id) {
      commit('SET_ACCOUNT_ID', id)
    },
    setNearBalance ({commit}, balance) {
      commit('SET_CURRENT_BALANCE', balance)
    },
    setNFTsCounter ({commit}, data) {
      commit('SET_NFT_COUNTER', data)
    },
    setNearAccount ({commit}, data) {
      commit('SET_NEAR_ACCOUNT', data)
    },
  },
  getters: {
    getEffect: state => state.allNFTs.find(x => x.token_id === state.effectChoice),
    getEffectChoice: state => state.effectChoice,
    getIpfs: state => state.ipfs,
    getResult: state => state.imageResult,
    getDeployedPictureMeta: state => state.deployedPictureMeta,
    getStatus: state => state.status,
    getTransactionHash: state => state.nftTransactionHash,
    getNftsAreLoading: state => state.nftLoading,
    getContractLoading: state => state.contractLoading,
    getAccountId: state => state.account_id,
    getNFTlimit: (state) => state.NFTlimit,
    getNFTsTotal: (state) => state.NFTsTotal,
    getAllNFTs: state => state.allNFTs,
    getNFTsByContract: state => state.NFTsByContract,
    getNFTforModification: (state) => state.NFTdata,
    getNFTArray: (state) => state.arrayNFTs,
    getCurrentWallet: (state) => state.wallet,
    getCurrentWalletBalance: (state) => state.balance,
    getEffectModalStatus: state => state.effectModalStatus,
    getDroppedImage: state => state.droppedImage,
    getNearAccount: state => state.nearAccount,
    getContract: state => state.contract,
    getBundleContract: state => state.bundle_contract,
    getEffectsContract: state => state.effects_contract,
    getEffectsListContract: state => state.effects_list_contract,
    getFactoryContract: state => state.factory_contract,
    getMainContracts: state => state.mainContracts,
    getActiveContract: state => state.activeContract,
    getUserStores: state => {
      if (state.user_stores_collection && state.user_stores_collection.length) {
        return state.user_stores_collection
          .map((item) => item.store_owner_id === state.account_id ? `${item.store_id}.${process.env.VUE_APP_COLLECTION_FACTORY}` : null).filter(Boolean)
      }

      return []
    },
  },
})

export default store