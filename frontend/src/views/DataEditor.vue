<template>
  <div class="page page--deploy">
    <h1>EDITOR</h1>
    <div class="editor-box">
      <div class="editor-box__main">
        <div id="jsoneditor" class="jsoneditor" />
        <div id="jsoneditorHidden" class="jsoneditor--hidden" />
      </div>
      <div class="editor-box__preview">
        <div
          v-if="editTokenData && editTokenData.token_id"
        >
          <div
            class="editor-box__preview-close"
            @click="closeModal"
          >
            <icon name="cross" :size="32" class="cross-icon" />
          </div>
          <form
            class="form-nft form-nft--editor"
          >
            <token-card
              :metadata="editTokenData"
              :edit-available="false"
            />
            <div class="form-ntf__inputs">
              <!--bundle items do not have contract field -->
              <template v-if="editTokenData.contract">
                <span class="form-nft-send__inputs-title">Contract</span>
                <input
                  type="text"
                  placeholder="NFT Contract"
                  class="input form-nft__input"
                  v-model="editTokenData.contract"
                >
              </template>
              <span class="form-nft-send__inputs-title">Title</span>
              <input
                type="text"
                placeholder="NFT title"
                class="input form-nft__input"
                v-model="editTokenData.metadata.title"
              >
              <span class="form-nft-send__inputs-title">Description</span>
              <textarea
                type="text"
                placeholder="NFT description"
                class="input form-nft__input form-nft__textarea"
                v-model="editTokenData.metadata.description"
              />
            </div>
            <div class="editor-box__actions">
              <!-- edit unsupported currently -->
              <span
                class="editor-box__actions-item editor-box__actions-item--disabled"
                title="edit NFT"
              >
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.4806 19.2857V19.7857C5.61321 19.7857 5.74039 19.733 5.83416 19.6393L5.4806 19.2857ZM0.714355 19.2857H0.214355C0.214355 19.5619 0.438213 19.7857 0.714355 19.7857L0.714355 19.2857ZM0.714355 14.5195L0.360802 14.1659C0.267034 14.2597 0.214355 14.3869 0.214355 14.5195H0.714355ZM14.1705 1.06328L14.5241 1.41683V1.41683L14.1705 1.06328ZM15.8557 1.06328L15.5021 1.41683V1.41683L15.8557 1.06328ZM18.9368 4.1444L19.2903 3.79085V3.79085L18.9368 4.1444ZM18.9368 5.82953L18.5832 5.47597L18.9368 5.82953ZM5.4806 18.7857H0.714355V19.7857H5.4806V18.7857ZM1.21436 19.2857V14.5195H0.214355V19.2857H1.21436ZM1.06791 14.873L14.5241 1.41683L13.817 0.709726L0.360802 14.1659L1.06791 14.873ZM15.5021 1.41683L18.5832 4.49796L19.2903 3.79085L16.2092 0.709726L15.5021 1.41683ZM18.5832 5.47597L5.12705 18.9322L5.83416 19.6393L19.2903 6.18308L18.5832 5.47597ZM18.5832 4.49796C18.8533 4.76803 18.8533 5.2059 18.5832 5.47597L19.2903 6.18308C19.9509 5.52249 19.9509 4.45145 19.2903 3.79085L18.5832 4.49796ZM14.5241 1.41683C14.7942 1.14676 15.232 1.14676 15.5021 1.41683L16.2092 0.709726C15.5486 0.0491301 14.4776 0.0491301 13.817 0.709726L14.5241 1.41683Z"></path><path d="M10.6006 4.63389C10.4054 4.43863 10.0888 4.43863 9.89352 4.63389C9.69825 4.82915 9.69825 5.14573 9.89352 5.341L10.6006 4.63389ZM14.6598 10.1072C14.855 10.3025 15.1716 10.3025 15.3669 10.1072C15.5621 9.91198 15.5621 9.5954 15.3669 9.40014L14.6598 10.1072ZM9.89352 5.341L14.6598 10.1072L15.3669 9.40014L10.6006 4.63389L9.89352 5.341Z"></path></svg>
              </span>
              <span
                :class="['editor-box__actions-item',
                         {
                           'editor-box__actions-item--active': showSendNFTForm,
                           'editor-box__actions-item--disabled': !editTokenData.contract
                         }
                ]"
                title="send NFT"
                @click="showSendNFTForm = !showSendNFTForm"
              >
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.31442 10.9775C8.11915 11.1727 8.11915 11.4893 8.31442 11.6846C8.50968 11.8799 8.82626 11.8799 9.02152 11.6846L8.31442 10.9775ZM14.0747 6.63145C14.2699 6.43618 14.2699 6.1196 14.0747 5.92434C13.8794 5.72908 13.5628 5.72908 13.3676 5.92434L14.0747 6.63145ZM9.02152 11.6846L14.0747 6.63145L13.3676 5.92434L8.31442 10.9775L9.02152 11.6846Z"></path><path d="M12.2368 18.7092L11.7896 18.9328L12.2368 18.7092ZM14.1661 18.5495L13.6882 18.4025L14.1661 18.5495ZM8.2773 11.2565L8.05369 11.7037L8.2773 11.2565ZM8.74361 11.7228L9.19083 11.4992L8.74361 11.7228ZM1.45055 5.83401L1.59759 6.3119L1.45055 5.83401ZM1.29088 7.76324L1.06727 8.21046L1.29088 7.76324ZM17.9349 0.761896L18.082 1.23979L17.9349 0.761896ZM19.2382 2.06515L19.7161 2.21219L19.2382 2.06515ZM17.7879 0.284007L1.3035 5.35612L1.59759 6.3119L18.082 1.23979L17.7879 0.284007ZM1.06727 8.21046L8.05369 11.7037L8.5009 10.8092L1.51449 7.31603L1.06727 8.21046ZM8.2964 11.9464L11.7896 18.9328L12.684 18.4856L9.19083 11.4992L8.2964 11.9464ZM14.6439 18.6966L19.7161 2.21219L18.7603 1.9181L13.6882 18.4025L14.6439 18.6966ZM11.7896 18.9328C12.412 20.1776 14.2346 20.0268 14.6439 18.6966L13.6882 18.4025C13.5442 18.8704 12.903 18.9235 12.684 18.4856L11.7896 18.9328ZM8.05369 11.7037C8.15872 11.7562 8.24388 11.8413 8.2964 11.9464L9.19083 11.4992C9.04155 11.2006 8.79946 10.9585 8.5009 10.8092L8.05369 11.7037ZM1.3035 5.35612C-0.0267255 5.76542 -0.177565 7.58804 1.06727 8.21046L1.51449 7.31603C1.07656 7.09707 1.12963 6.45589 1.59759 6.3119L1.3035 5.35612ZM18.082 1.23979C18.4984 1.11166 18.8884 1.50169 18.7603 1.9181L19.7161 2.21219C20.0803 1.0285 18.9716 -0.0802037 17.7879 0.284007L18.082 1.23979Z"></path></svg>
              </span>
              <span
                title="unbundle NFT"
                :class="['editor-box__actions-item',
                         {
                           'editor-box__actions-item--disabled': (editTokenData.bundles && !editTokenData.bundles.length) || !editTokenData.contract
                         }
                ]"
                @click="unbundleTrigger"
              >
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.1431 19.2857C14.1431 19.5619 14.3669 19.7857 14.6431 19.7857C14.9192 19.7857 15.1431 19.5619 15.1431 19.2857H14.1431ZM15.1431 16.9643C15.1431 16.6881 14.9192 16.4643 14.6431 16.4643C14.3669 16.4643 14.1431 16.6881 14.1431 16.9643H15.1431ZM15.1431 19.2857V16.9643H14.1431V19.2857H15.1431Z"></path><path d="M16.9644 14.1429C16.6882 14.1429 16.4644 14.3667 16.4644 14.6429C16.4644 14.919 16.6882 15.1429 16.9644 15.1429L16.9644 14.1429ZM19.2858 15.1429C19.5619 15.1429 19.7858 14.919 19.7858 14.6429C19.7858 14.3667 19.5619 14.1429 19.2858 14.1429V15.1429ZM16.9644 15.1429L19.2858 15.1429V14.1429L16.9644 14.1429L16.9644 15.1429Z"></path><path d="M4.60833 9.53324C4.80359 9.33798 4.80359 9.0214 4.60833 8.82613C4.41307 8.63087 4.09649 8.63087 3.90122 8.82613L4.60833 9.53324ZM11.1743 16.0992C11.3696 15.904 11.3696 15.5874 11.1743 15.3921C10.9791 15.1969 10.6625 15.1969 10.4672 15.3921L11.1743 16.0992ZM3.90122 8.82613L2.25973 10.4676L2.96683 11.1747L4.60833 9.53324L3.90122 8.82613ZM9.53282 17.7407L11.1743 16.0992L10.4672 15.3921L8.82572 17.0336L9.53282 17.7407ZM2.25973 17.7407C4.26814 19.7491 7.52441 19.7491 9.53282 17.7407L8.82572 17.0336C7.20783 18.6515 4.58472 18.6515 2.96683 17.0336L2.25973 17.7407ZM2.25973 10.4676C0.251315 12.476 0.251315 15.7323 2.25973 17.7407L2.96683 17.0336C1.34895 15.4157 1.34895 12.7926 2.96683 11.1747L2.25973 10.4676Z"></path><path d="M3.03578 5.85713C3.31193 5.85713 3.53578 5.63327 3.53578 5.35713C3.53578 5.08099 3.31193 4.85713 3.03578 4.85713V5.85713ZM0.714356 4.85713C0.438213 4.85713 0.214355 5.08099 0.214355 5.35713C0.214355 5.63327 0.438213 5.85713 0.714355 5.85713L0.714356 4.85713ZM3.03578 4.85713L0.714356 4.85713L0.714355 5.85713L3.03578 5.85713V4.85713Z"></path><path d="M8.82565 3.90199C8.63038 4.09725 8.63038 4.41383 8.82565 4.60909C9.02091 4.80436 9.33749 4.80436 9.53275 4.60909L8.82565 3.90199ZM17.3867 9.18003L17.0331 8.82648L17.3867 9.18003ZM15.3916 10.468C15.1964 10.6632 15.1964 10.9798 15.3916 11.1751C15.5869 11.3703 15.9035 11.3703 16.0987 11.1751L15.3916 10.468ZM9.53275 4.60909L11.1743 2.9676L10.4671 2.26049L8.82565 3.90199L9.53275 4.60909ZM17.0331 8.82648L15.3916 10.468L16.0987 11.1751L17.7402 9.53359L17.0331 8.82648ZM17.0331 2.9676C18.651 4.58548 18.651 7.20859 17.0331 8.82648L17.7402 9.53359C19.7487 7.52518 19.7487 4.2689 17.7402 2.26049L17.0331 2.9676ZM11.1743 2.9676C12.7921 1.34971 15.4152 1.34971 17.0331 2.9676L17.7402 2.26049C15.7318 0.252078 12.4756 0.252078 10.4671 2.26049L11.1743 2.9676Z"></path><path d="M5.85742 0.714279C5.85742 0.438137 5.63356 0.214279 5.35742 0.214279C5.08128 0.214279 4.85742 0.438137 4.85742 0.714279L5.85742 0.714279ZM4.85742 3.03571C4.85742 3.31185 5.08128 3.53571 5.35742 3.53571C5.63356 3.53571 5.85742 3.31185 5.85742 3.03571H4.85742ZM4.85742 0.714279L4.85742 3.03571H5.85742L5.85742 0.714279L4.85742 0.714279Z"></path></svg>
              </span>
              <span
                :class="['editor-box__actions-item',
                         {
                           'editor-box__actions-item--disabled': !editTokenData.contract
                         }
                ]"
                title="add NFT to bundle"
                @click="showAddingToBundle = !showAddingToBundle"
              >
                <svg viewBox="0 0 24 24"><path d="M13 15.6C13.3 15.8 13.7 15.8 14 15.6L19 12.7V13C19.7 13 20.4 13.1 21 13.4V11.6L22 11C22.5 10.7 22.6 10.1 22.4 9.6L20.9 7.1C20.8 6.9 20.7 6.7 20.5 6.6L12.6 2.2C12.4 2.1 12.2 2 12 2S11.6 2.1 11.4 2.2L3.6 6.6C3.4 6.7 3.2 6.8 3.1 7L1.6 9.6C1.3 10.1 1.5 10.7 2 11C2.3 11.2 2.7 11.2 3 11V16.5C3 16.9 3.2 17.2 3.5 17.4L11.4 21.8C11.6 21.9 11.8 22 12 22S12.4 21.9 12.6 21.8L13.5 21.3C13.2 20.7 13.1 20 13 19.3M11 19.3L5 15.9V9.2L11 12.6V19.3M20.1 9.7L13.8 13.3L13.2 12.3L19.5 8.7L20.1 9.7M12 10.8V4.2L18 7.5L12 10.8M20 15V18H23V20H20V23H18V20H15V18H18V15H20Z" /></svg>
              </span>
              <span
                class="editor-box__actions-item"
                title="remove NFT from bundle"
                @click="removeFromBundleTrigger"
                :class="['editor-box__actions-item',
                         {
                           'editor-box__actions-item--disabled': editTokenData.contract
                         }
                ]"
              >
                <svg viewBox="0 0 24 24"><path d="M13 15.6C13.3 15.8 13.7 15.8 14 15.6L19 12.7V13C19.7 13 20.4 13.1 21 13.4V11.6L22 11C22.5 10.7 22.6 10.1 22.4 9.6L20.9 7.1C20.8 6.9 20.7 6.7 20.5 6.6L12.6 2.2C12.4 2.1 12.2 2 12 2S11.6 2.1 11.4 2.2L3.6 6.6C3.4 6.7 3.2 6.8 3.1 7L1.6 9.6C1.3 10.1 1.5 10.7 2 11C2.3 11.2 2.7 11.2 3 11V16.5C3 16.9 3.2 17.2 3.5 17.4L11.4 21.8C11.6 21.9 11.8 22 12 22S12.4 21.9 12.6 21.8L13.5 21.3C13.2 20.7 13.1 20 13 19.3M11 19.3L5 15.9V9.2L11 12.6V19.3M20.1 9.7L13.8 13.3L13.2 12.3L19.5 8.7L20.1 9.7M12 10.8V4.2L18 7.5L12 10.8M23 20H15V18H23V20Z" /></svg>
              </span>
            </div>
          </form>
        </div>

        <modal-template
          v-if="showSendNFTForm"
          small
          @close="showSendNFTForm = false"
        >
          <template #header>
            <h2>Send NFT</h2>
          </template>
          <template #content>
            <div
              class="editor-send-modal"
            >
              <form
                class="form-nft"
              >
                <div class="form-ntf__inputs">
                  <span class="form-nft-send__inputs-title">Wallet address</span>
                  <input
                    type="text"
                    placeholder="Wallet"
                    class="input form-nft__input"
                    v-model="nftObj.receiver_id"
                  >
                  <button
                    class="main-btn"
                    @click.prevent="sendNFT"
                  >Submit</button>
                </div>
              </form>
            </div>

          </template>
        </modal-template>

        <modal-template
          v-if="showAddingToBundle"
          small
          @close="showAddingToBundle = false"
        >
          <template #header>
            <h2>Add new NFT to bundle</h2>
          </template>
          <template #content>
            <div
              class="bundle-item"
            >
              <div
                v-for="contractData in getNFTsByContract"
                :key="contractData.id"
                class="nft-cards__contract"
              >
                <template v-if="contractData.NFTS && contractData.NFTS.length">
                  <h3>Contract: {{contractData.contractName}}</h3>
                  <div class="nft-cards__contract-inner">
                    <div
                      v-for="item in contractData.NFTS"
                      :key="`nft--${item.token_id}`"
                      class="nft-cards__contract__item"
                    >
                      <token-card
                        :metadata="item"
                        :is-adding="true"
                        @submit-token="createNFTforBundle(item)"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </div>

          </template>
        </modal-template>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from "vuex"
import _ from "lodash"
import TokenCard from '@/components/TokenCard/TokenCard'
import { KeyPair, utils } from 'near-api-js'
import ModalTemplate from '@/components/ModalTemplate/ModalTemplate'

import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

export default {
  name: "DataEditor",

  components: {
    TokenCard,
    ModalTemplate,
  },

  data() {
    return {
      jsonOnInit: {},
      jsoneditor: null,
      jsonOnChange: {},
      showSendNFTForm: false,
      showAddingToBundle: false,
      currentToken: 'token-1652965846149',
      editTokenData: {},
      mainTokenData: {},
      nftObj: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
          media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/1200px-VitalikButerinProfile.jpg',
        },
        receiver_id: 'near.testnet',
        token_id: [],
        contract_id: 'nft-list.near_testing.testnet',
      },
      contractVal: null,
      contractName: 'nft-list12.near_testing.testnet',
      contractNear: 4,
      accountForLogin: 'near_testing.testnet',
      isFullAccess: false,
    }
  },

  computed: {
    ...mapGetters([
      'getCurrentWallet',
      'getAllNFTs',
      'getNFTsByContract',
      'getContract',
      'getNearAccount',
      'getBundleContract'
    ]),
    getFilteredNFTsByContract() {
      const editorObj = {
        contracts: {}
      }
      const sortedByIdContracts =  [].concat(this.getNFTsByContract).sort((a, b) => a.id - b.id)
      sortedByIdContracts.forEach((item) => {

        const obj = {
          [item.contractName]: {
            tokens: {}
          }
        }

        item.NFTS.forEach((nftData) => {
          const nftObj = {
            // slice need for unique identifer, cause there is a high chance of duplicated titles
            [`${nftData.metadata.title}:${nftData.token_id.slice(-5)}`]: {
              bundles: {}
            }
          }

          if (nftData.bundles && nftData.bundles.length) {
            const bundlesObj = {}
            console.log(nftData.bundles, 'nftData.bundles')

            nftData.bundles.forEach((bundleData) => {
              bundlesObj[bundleData.token_id] = null
            })
            console.log(bundlesObj, 'bundlesObj')

            nftObj[`${nftData.metadata.title}:${nftData.token_id.slice(-5)}`].bundles = bundlesObj
          }

          Object.assign(obj[item.contractName].tokens, nftObj)


        })
        Object.assign(editorObj.contracts, obj)

        return editorObj
      })
      console.log(editorObj, 'editorObj')

      return editorObj
    },
    NFTComputedData() {
      return this.getAllNFTs.find((item) => item.token_id === this.currentToken)
    },
  },

  mounted() {
    this.accountForLogin = this.getContract.account.accountId
    this.contractName = `nft-list12.${this.getContract.account.accountId}`

    if (sessionStorage.getItem('near_access_key')) {
      this.isFullAccess = true
    }
    this.jsonOnInit = this.getFilteredNFTsByContract
    this.jsonOnChange = this.getFilteredNFTsByContract
    console.log(this.getAllNFTs, 'getAllNFTs')
    const self = this

    const options = {
      mode: 'tree',
      onChangeJSON: this.onChangeJSON,
      onClassName: this.onClassName,
      onEvent: async (v, e) => {
        const elementName = v.field
        if(!elementName) return

        if (e.type === 'click') {
          console.log(v, 'elementName v')
          const itemData = self.getAllNFTs.find((item) => item.token_id.slice(-5) === elementName.slice(-5))
          if (v.path[v.path.length - 2] === 'bundles') {
            console.log(v.path[v.path.length - 3], 'v.path[v.path.length - 3] v')
            // mainTokenData need for using inner bundle item contract and approved_id later on remove Trigger
            this.mainTokenData = self.getAllNFTs.find((item) => item.token_id.slice(-5) === v.path[v.path.length - 3].slice(-5))
            const bundlesData = await this.loadBundleNFTS(this.mainTokenData)
            console.log(bundlesData, 'bundlesData v')
            console.log(elementName, 'this.elementName')

            this.editTokenData = bundlesData.find((item) => item.token_id === elementName)
            console.log(this.editTokenData, 'this.editTokenData')
            return
          }

          console.log(itemData, 'itemDATA')
          this.editTokenData = itemData
        }
      },
    }
    const container = document.getElementById("jsoneditor")

    this.jsoneditor = new JSONEditor(container, options)
    this.jsoneditor.set(this.getFilteredNFTsByContract)

    const optionsOnInit = {
      mode: 'tree',
    }
    const containerOnInit = document.getElementById("jsoneditorHidden")

    this.jsoneditorOnInit = new JSONEditor(containerOnInit, optionsOnInit)
    this.jsoneditorOnInit.set(this.getFilteredNFTsByContract)
  },

  methods: {
    ...mapActions([
      'createNewUsualNFT',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'setNFTApproveId',
      'sendNFTByToken',
      'getNFTByToken',
      'triggerUnbundleNFT',
    ]),
    ...mapMutations([
      'ADD_TOKEN_TO_BUNDLE',
      'REMOVE_TOKEN_FROM_BUNDLE'
    ]),
    async loadBundleNFTS(mainNFTData) {
      const loadedBundleNFTs = []

      await Promise.all(mainNFTData.bundles.map(async (bundleData) => {
        const request = await this.getNearAccount.viewFunction(bundleData.contract, 'nft_tokens_for_owner', { account_id: this.getBundleContract.contractId, limit: 100 })
        console.log(request, 'request')

        let requestedNFTs = request.filter((item) => {
          return mainNFTData.bundles.find((bundleItem) => bundleItem.token_id === item.token_id)
        })
        
        let requestedNFTsRepeated = []
        
        // this checking, for bundles NFTs from same contracts
        if (loadedBundleNFTs && loadedBundleNFTs.length) {
          requestedNFTsRepeated = loadedBundleNFTs.filter((item) => {
            const foundItem = requestedNFTs.find((loadedItem) => loadedItem.token_id === item.token_id)
            return !foundItem ? null : item
          })
        }

        if (requestedNFTsRepeated && !requestedNFTsRepeated.length) {
          loadedBundleNFTs.push.apply(loadedBundleNFTs, requestedNFTs)
        }
      }))

      return loadedBundleNFTs
    },
    sendNFT() {
      console.log('SEND')
      if (!this.nftObj.receiver_id) {
        alert('Receiver ID field is empty')
      } else {
        this.sendNFTByToken({
          receiver: this.nftObj.receiver_id,
          token_data: this.editTokenData,
          minting_contract_id: this.editTokenData.contract,
        })
      }
    },
    unbundleTrigger() {
      const isBundling = confirm('Do you want to confirm unbundle?')

      if (isBundling) {
        this.triggerUnbundleNFT({ token_id: this.editTokenData.token_id })
      }
    },
    removeFromBundleTrigger() {
      const isRemoving = confirm('Do you want to remove NFT from bundle?')

      if (isRemoving) {
        const bundle_token_data = this.mainTokenData.bundles.find((item) => item.token_id === this.editTokenData.token_id)
        this.REMOVE_TOKEN_FROM_BUNDLE({ remove_token_data: bundle_token_data, bundle_id: this.mainTokenData.token_id })
      }
    },
    createNFTforBundle(addingToBundle) {
      console.log(addingToBundle, 'cre')
      const contract_of_mint = this.getAllNFTs.find((item) => item.token_id === addingToBundle.token_id)
      console.log(contract_of_mint, 'contract_of_mint')

      this.ADD_TOKEN_TO_BUNDLE({
        token_to_add_data: addingToBundle,
        contract_of_mint: contract_of_mint ? contract_of_mint.contract : null,
        bundle_token_id: this.editTokenData.token_id,
      })
    },
    async deploySubmit() {
      try {
        const amountInYocto = utils.format.parseNearAmount(this.contractNear.toString())
        const keyPair = KeyPair.fromRandom("ed25519")
        console.log(keyPair, 'keyPair')

        const result = await this.getNearAccount.createAndDeployContract(
          this.contractName,
          keyPair.publicKey,
          this.contractVal,
          amountInYocto,
        )

        const isReady = await result.ready
        console.log(isReady, 'isReady')

        if (result) {
          this.$notify({
            group: 'deploy',
            type: 'success',
            title: 'Contract deployed:',
            text: `<a class="link link--reverse" target="_blank" href="https://explorer.testnet.near.org/accounts/${result.accountId}">link to contract</a>`,
            duration: 10000,
          })
        }
        console.log(result, 'result')
      } catch(err) {
        console.log(err.message, 'err2')
        this.$notify({
          group: 'deploy',
          type: 'error',
          title: 'Error:',
          text: err.message,
          duration: 10000,
        })
      }
    },
    closeModal() {
      this.showAddNFTForm = false
      this.showSendNFTForm = false
      this.showDeployContract = false
    },
    onChangeJSON(json) {
      console.log(json, 'onChangeJSON')
      this.jsonOnChange = json
    },
    onClassName({ path }) {
      console.log(path, 'PATH')
      const leftValue = _.get(this.jsonOnInit, path)
      const rightValue = _.get(this.jsonOnChange, path)

      return _.isEqual(leftValue, rightValue)
        ? 'the_same_element'
        : 'different_element'
    },
    resetModals() {
      this.showAddNFTForm = false
      this.showSendNFTForm = false
      this.showDeployContract = false
    },
    onTextareaChange(e) {
      console.log(typeof this.json2, 'CHANGE')
      console.log(this.json, 'CHANGE json2')

      if (typeof e.target.value === 'string') {
        this.jsoneditor.updateText(e.target.value)
      }

      if (typeof e.target.value === 'object') {
        this.jsoneditor.set(e.target.value)
      }
    },
  },
}
</script>

<style lang="scss">
.editor-box {
  display: flex;
  width: 100%;
}

.editor-box__main {
  width: 50%;
}

.editor-box__preview {
  position: relative;
  width: 50%;
  margin-left: 20px;
}

.jsoneditor--hidden {
  display: none;
}

.jsoneditor {
    border: thin solid #2d0949;
    height: 70vh;
    background: #fff;
}
.jsoneditor-menu {
    background-color: #2d0949;
}

div.jsoneditor-tree {
  padding: 15px 0 0 0;
}

div.jsoneditor-field, div.jsoneditor-value, div.jsoneditor td, div.jsoneditor th, div.jsoneditor textarea, pre.jsoneditor-preview, .jsoneditor-schema-error, .jsoneditor-popover {
  font-family: 'Roboto mono'
}

#jsoneditor .different_element {
  background-color: #d1ff9d;
}
#jsoneditor .different_element div.jsoneditor-field,
#jsoneditor .different_element div.jsoneditor-value {
  color: #000;
}

.add-btn--disabled {
  color: #c8c8c8!important;
  cursor: not-allowed!important;
  
  .jsoneditor-icon {
    opacity: .3;
  }
}

.editor-box__preview-close {
  position: absolute;
  right: -5px;
  top: -20px;
  cursor: pointer;


  &:hover {
    color: red;
    fill: red;
  }
}

.form-nft--editor {
  flex-wrap: wrap;

  svg {
    width: 24px;
    fill: #5ce9bc;
    transition: fill .2s ease;
  }

  .form-ntf__inputs {
    width: 50%;
    margin-right: 0;
  }
}

.editor-box__actions {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.editor-box__actions-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  margin: 0 5px;
  border: 1px solid #5ce9bc;
  background-color: #2d0949;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color .2s ease;

  &:hover {
    background-color: #5ce9bc;
    svg {
      fill: #fff;
    }
  }
}

.editor-box__actions-item--active {
  background-color: #5ce9bc;
  svg {
    fill: #fff;
  }
}

.editor-box__actions-item--disabled {
  opacity: .3;
  pointer-events: none;
}
</style>