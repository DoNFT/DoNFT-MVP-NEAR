import Vue from 'vue'
import Vuex from 'vuex'

import {
  nftTokensForOwner,
  deployNFTtoIPFS,
  approveNFT,
  createRandomNft,
  createUsualNFT,
  createBundleNFT,
  unbundleNFT,
  sendNFT,
  getImageForTokenByURI,
  checkForContract,
} from "@/near_utilities"

import {StatusType, getIPFS} from "@/utilities"
import {modifyPicture, applyNFTsEffect} from "@/api"

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
    bundle_contract: null,
    effects_contract: null,
    mainContracts: [],
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
    setDeployedPictureMeta (state, meta) {
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
    SET_CURRENT_BUNDLE_CONTRACT (state, payload) {
      state.bundle_contract = payload
    },
    SET_CURRENT_EFFECTS_CONTRACT (state, payload) {
      state.effects_contract = payload
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
    SET_MAIN_CONTRACTS (state, payload) {
      state.mainContracts = payload
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
    // async setBalance ({commit, state}) {
    //   commit('setAccountBalance', await getAccountBalance(state.ethersProvider, state.accountAddress))
    // },
    setContractLoading ({commit}, data) {
      commit('SET_CURRENT_CONTRACT_LOADING', data)
    },
    setEffectChoice ({commit}, choice) {
      commit('setEffectChoice', choice)
    },
    setNFTsLoading ({commit}, isLoading) {
      commit('setNFTsLoading', isLoading)
    },
    setWrappedNFTsLoading ({commit}, isLoading) {
      commit('setWrappedNFTsLoading', isLoading)
    },
    setStatus ({commit}, status) {
      commit("setStatus", status)
    },
    async setIpfs ({commit}) {
      const ipfs = await getIPFS()
      commit('setIpfs', await ipfs.create())
    },
    async setResult ({commit, dispatch, getters}, type) {
      dispatch('setStatus', StatusType.Applying)
      if (type === "base64") {
        commit('setImageResult', getters.getNFTforModification.media)
      } else {
        console.log(getters.getNFTforModification.media, 'getters.getNFTforModification.media')
        commit('setImageResult', await modifyPicture(getters.getNFTforModification.media, getters.getEffectChoice))
      }
    },
    async setEffectResult ({commit, dispatch}, effectData) {
      dispatch('setStatus', StatusType.Applying)
      console.log(effectData, 'EFFFECT DATA')
      commit('setDeployedPictureMeta', await applyNFTsEffect(effectData))
    },
    async setDeployedPictureMeta ({commit, dispatch, getters}, type) {
      dispatch('setStatus', StatusType.DeployingToIPFS)
      commit('setDeployedPictureMeta', await deployNFTtoIPFS(getters.getIpfs, getters.getResult, getters.getNFTforModification, type))
    },
    async getListOfNFT ({commit, dispatch, getters}) {
      dispatch('setNFTsLoading', true)
      const result = await nftTokensForOwner({dispatch}, getters.getAccountId, getters.getContract, getters.getNFTlimit)
      // const result = await nftTokensForOwner({dispatch}, 'nft-example6.pe4en.testnet', getters.getContract2, getters.getNFTlimit)
      commit('passAllNFTs', result)
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
    createNewRandomNFT ({getters, dispatch},  { token_id, metadata }) {
      dispatch('setStatus', StatusType.Minting)
      createRandomNft(token_id, metadata, getters.getAccountId, getters.getContract)
    },
    createNewUsualNFT ({getters, dispatch},  { token_id, metadata, contract_id }) {
      dispatch('setStatus', StatusType.Minting)
      createUsualNFT(token_id, metadata, getters.getAccountId, getters[contract_id])
    },
    createNewBundleNFT ({getters, dispatch},  { token_id, metadata, bundles }) {
      dispatch('setStatus', StatusType.Minting)
      createBundleNFT(token_id, metadata, bundles, getters.getBundleContract)
    },
    triggerUnbundleNFT ({getters, dispatch},  { token_id, nft_data, bundles_data }) {
      dispatch('setStatus', StatusType.Minting)
      console.log(getters, token_id, nft_data, bundles_data, 'token_id, nft_data, bundle_data')
      unbundleNFT(token_id, getters.getBundleContract)
    },
    async setNFTApproveId ({getters, dispatch}, { approve_id, token_id, minting_contract_id }) {
      let contractData = await checkForContract(getters, minting_contract_id)
      console.log(contractData, 'contract DATA')

      dispatch('setStatus', StatusType.Approving)
      approveNFT(approve_id, token_id, contractData)
    },
    async sendNFTByToken ({getters, dispatch}, { receiver, token_data, minting_contract_id }) {
      dispatch('setStatus', StatusType.Approving)
      let contractData = await checkForContract(getters, minting_contract_id)

      sendNFT(receiver, token_data, contractData)
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
    setMainContracts ({commit}, data) {
      commit('SET_MAIN_CONTRACTS', data)
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
    getMainContracts: state => state.mainContracts,
  },
})

export default store