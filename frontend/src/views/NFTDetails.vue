<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === StatusType.Approving" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1 class="h1--no-logo">{{ statusText }}</h1>
    </div>
    <main v-else>
      <div>
        <h1 class="h1--no-logo">Details of <span v-if="hasBundles">Bundle</span> NFT</h1>
        <div
          class="form-nft-send form-nft__detail-page"
          v-if="NFTComputedData && NFTComputedData.metadata"
        >
          <div class="nft-cards">
            <token-card
              :metadata="NFTComputedData"
              :edit-available="false"
            />
          </div>
          <div class="form-nft-send__inputs">
            <span class="form-nft-send__inputs-title">Title</span>
            <input
              type="text"
              placeholder="NFT title"
              class="input form-nft__input"
              v-model="NFTComputedData.metadata.title"
            >
            <span class="form-nft-send__inputs-title">Description</span>
            <textarea
              type="text"
              placeholder="NFT description"
              class="input form-nft__input form-nft__textarea"
              v-model="NFTComputedData.metadata.description"
            />
            <div class="form-nft__bottom">
              <button
                class="main-btn"
                :disabled="true"
              >Burn NFT</button>
              <button
                class="main-btn"
                type="submit"
                :disabled="true"
                @click="changeFormat"
              >Change Format</button>
              <button
                class="main-btn"
                @click="approveNFTHandler"
                :disabled="!isNFTApproved(NFTComputedData) || !nftObj.receiver_id"
              >Approve NFT</button>
              <button
                class="main-btn"
                type="submit"
                :disabled="!hasBundles"
                @click="unbundleNFT"
              >Unbundle NFT</button>
              <router-link
                class="main-btn"
                :to="{ name: 'SendNFT', params: { id: NFTComputedData.token_id }}"
              >Send NFT page</router-link>
            </div>
          </div>
        </div>
      </div>
      

      <modal-template
        v-if="addingToBundle || addingToToken"
        small
        @close="addingToBundle = false; addingToToken = false"
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
                    :class="{ 'chosen-card': cardClass(item)}"
                  >
                    <token-card
                      :metadata="item"
                      :is-adding="true"
                      @submit-token="chooseNFT"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <template #footer>
          <button
            @click="createNFTforBundle"
            class="main-btn"
          >Submit</button>
        </template>
      </modal-template>

      <div class="bundle-data" v-if="bundleNFTsComputedData">
        <div class="nft-cards__contract-inner">
          <div
            class="nft-cards__contract__item nft-cards__contract__item--bundle-data"
            v-for="item in bundleNFTsComputedData"
            :key="item.token_id"
          >
            <h5>Token ID: <br> {{ item.token_id }}</h5>
            <token-card
              class="bundle-data__token"
              :is-bundle="true"
              :metadata="item"
              @edit-token="toggleEditBundle"
              @remove-token="removeBundleToken"
              @add-token="addToToken"
            />
            <div
              class="nft-cards__contract__item__inside"
              v-if="item.bundles && item.bundles.length && modalBundleNFTData"
            >
              <modal-template
                v-if="showEditBundle"
                small
                @close="closeEditModal"
              >
                <template #header>
                  <h2>Bundle {{modalBundleNFTData.token_id}} contain {{modalBundleNFTData.bundles.length}} NFT</h2>
                </template>
                <template #content>
                  <div
                    class="nft-cards__contract__item__inside-wrap"
                    v-for="bundle in modalBundleNFTData.bundles"
                    :key="bundle.token_id"
                  >
                    <template v-if="getInnerNFTdata(bundle)">
                      <h3>Token ID: <br> {{ bundle.token_id }}</h3>
                      <token-card
                        class="bundle-data__token"
                        :is-bundle="true"
                        :metadata="getInnerNFTdata(bundle)"
                        @edit-token="toggleEditBundle"
                        @remove-token="removeBundleToken"
                        @add-token="addToToken"
                      />
                    </template>
                    <h3 v-else>Can't load Tokens metadata</h3>
                  </div>
                </template>
                <template #footer>
                  <button
                    @click="addingToBundle = true; showEditBundle = false"
                    class="main-btn"
                  >Add NFT</button>
                </template>
              </modal-template>
            </div>
          </div>
          <div
            class="card-placeholder"
            @click="addingToBundle = true"
          >
            <icon name="plus" :size="64" class="upload-icon" />

            <div class="card-placeholder-component__text">
              <span>add NFT</span> <br>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import Spinner from "@/components/Spinner"
import { mapGetters, mapActions, mapMutations } from "vuex"
import NavBar from '@/components/NavBar/NavBar'
import TokenCard from '@/components/TokenCard/TokenCard'
import StatusType from "@/mixins/StatusMixin"
import ModalTemplate from '@/components/ModalTemplate/ModalTemplate'

export default {
  name: "NFTDetails",

  components: {
    Spinner,
    NavBar,
    TokenCard,
    ModalTemplate,
  },

  data() {
    return {
      nftObj: {
        receiver_id: 'near_testing2.testnet',
        token_id: [],
        media: '',
      },
      choosenTokens: [],
      nftObjForBundle: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
          media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/1200px-VitalikButerinProfile.jpg',
        },
        receiver_id: '',
        token_id: [],
        contract_id: '',
      },
      showEditBundle: false,
      addingToBundle: false,
      // in this case, we adding NFT to inner bundle, 2nd-3rd level etc...
      addingToToken: false,
      editingBundle: {},
      innerBundleForAdd: {},
      mainBundleNFTData: {},
      modalBundleNFTData: {},
      computedNFTdata: {},
      secondaryNFTsFullData: [],
    }
  },

  mixins: [StatusType],

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
      'getNearAccount',
      'getContract',
      'getEffectsContract',
      'getAccountId',
      'getBundleContract',
      'getNFTsByContract',
    ]),
    bundleNFTsComputedData() {
      return this.mainBundleNFTData
    },
    getNav() {
      return [
        {
          text: 'Back to Gallery',
          name: 'ChooseNFT',
          params: null,
        },
      ]
    },
    isNFTApproved() {
      return (NFTComputedData) => {
        let status = true

        // if input ID equal to approved_account_ids key, its approved and able to send
        if (NFTComputedData && NFTComputedData.approved_account_ids) {
          Object.keys(this.NFTComputedData.approved_account_ids).forEach((item) => {
            if (item === this.getBundleContract.contractId) {
              status = false
            }
          })
        }

        return status
      }
    },
    hasBundles() {
      return this.NFTComputedData && this.NFTComputedData.bundles && this.NFTComputedData.bundles.length
    },
    NFTComputedData() {
      return this.getAllNFTs.find((item) => item.token_id === this.$route.params.id) || this.computedNFTdata
    },
    cardClass() {
      return (idx) => this.choosenTokens.indexOf(idx) !== -1
    },
    getInnerNFTdata() {
      return (token) => this.secondaryNFTsFullData.find((item) => item.token_id === token.token_id)
    },
    mergedTokens() {
      let arr = []
      let mainContracts = [process.env.VUE_APP_BUNDLE_CONTRACT, process.env.VUE_APP_NFTS_CONTRACT]
      this.getNFTsByContract.filter((item) => mainContracts.includes(item.contractName)).filter((contract) => arr.push(...contract.NFTS))
      return arr
    }
  },

  watch: {
    getAllNFTs: {
      handler(value) {
        const data = value.find((item) => item.token_id === this.$route.params.id)
        this.computedNFTdata = data
      },
    },
    // removed watcher from mixin, because watcher triggering twice on status change
    getStatus: {
      handler(curVal) {
        if (curVal !== -1) {
          this.$notify({
            group: 'foo',
            type: curVal < 5 ? 'info' : 'success',
            title: 'Status:',
            text: this.statusText,
            duration: 5000,
          })
        }
      },
    },
  },

  async mounted() {
    this.getNFTs(this.getContract)

    if (this.NFTComputedData) {
      if (this.NFTComputedData.bundles && this.NFTComputedData.bundles.length) {
        this.mainBundleNFTData = await this.loadBundlesNFTsData(this.NFTComputedData.bundles, this.NFTComputedData.contract)
      }
    }
  },

  methods: {
    ...mapActions([
      'setNFTApproveId',
      'sendNFTByToken',
      'getNFTByToken',
      'addNFTtoBundle',
      'triggerUnbundleNFT',
    ]),
    ...mapMutations([
      'REMOVE_TOKEN_FROM_BUNDLE',
      'ADD_TOKEN_TO_BUNDLE',
    ]),
    closeEditModal() {
      this.showEditBundle = !this.showEditBundle
      this.innerBundleForAdd = {}
    },
    toggleEditBundle(data) {
      console.log(data, 'toggle EDIT')
      this.showEditBundle = true
      const mainBundle = this.bundleNFTsComputedData.find((item) => item.token_id === data.token_id)
      const secondaryBundle = this.secondaryNFTsFullData.find((item) => item.token_id === data.token_id)

      this.modalBundleNFTData = mainBundle ? mainBundle : secondaryBundle
      console.log(this.modalBundleNFTData, 'this.modalBundleNFTData EDIT')
    },
    // just for testing purposes
    async getNFTs(contract) {
      await contract
        .nft_tokens().then((res) => console.log(res, 'TOKENS getOwnerNFTs'))
      await contract
        .nft_total_supply().then((res) => console.log(res, 'TOKENS nft_total_supply'))
    },
    addToToken(data) {
      console.log(data, 'data')
      this.innerBundleForAdd = this.NFTComputedData.bundles.find((item) => item.token_id === data.token_id)
      this.addingToToken = true
    },
    chooseNFT(item) {
      const index = this.choosenTokens.findIndex((_) => _ === item)

      if (index > -1) {
        this.choosenTokens.splice(index, 1)
      } else {
        this.choosenTokens.push(item)
      }
    },
    async createNFTforBundle() {
      console.log(this.choosenTokens, 'this.choosenTokens')
      // const bundleFullData = innerBundle ? innerBundle : this.choosenTokens
      const tokensToAdd = []
      const tokensToApprove = []
      const contractOfBundle = this.addingToToken ? this.innerBundleForAdd : null

      this.choosenTokens.map((tokenData) => {
        const obj = {
          contract: null,
          token_id: tokenData.token_id,
          approval_id: tokenData.approved_account_ids[this.getBundleContract.contractId] || 0,
          token_role: 0,
          // todo: possibly need rename, meaning not clear
          owner_id: this.addingToToken ? contractOfBundle.contract : this.NFTComputedData.contract,
        }

        obj.contract = this.getAllNFTs.find((item) => item.token_id === tokenData.token_id).contract
        
        tokensToApprove.push(obj.token_id)
        tokensToAdd.push(obj)
      })

      console.log(tokensToAdd, 'tokensToAdd')
      this.addNFTtoBundle({
        token_to_add_data: tokensToAdd,
        tokens_to_approve: tokensToApprove,
        // if we adding to inner NFTs, pulling their id, if not, using MAIN NFT id
        bundle_token_id: this.addingToToken ? this.innerBundleForAdd.token_id : this.NFTComputedData.token_id,
        contractId: contractOfBundle ? contractOfBundle.contract : null,
        // Important
        // currently only support NFTS from 1 CONTRACT for adding
        // if it's first level NFTs, owner_id should be BUNDLE contract
        owner_id: contractOfBundle ? contractOfBundle.contract : process.env.VUE_APP_BUNDLE_CONTRACT,
      })
    },
    removeBundleToken(remove_token_data) {
      const bundle_token_data = this.NFTComputedData.bundles.find((item) => item.token_id === remove_token_data.token_id)
      this.REMOVE_TOKEN_FROM_BUNDLE({ remove_token_data: bundle_token_data, bundle_id: this.NFTComputedData.token_id })
    },
    // requesting metadata of bundles NFT. to render them
    async loadBundlesNFTsData(passedBundleData) {
      const loadedBundleNFTs = []

      // account_id for nft_tokens_for_owner
      // in case of bundle, main BUNDLE NFT, always have 1 OWNER
      // all other inner NFTs could have different owners
      await Promise.all(passedBundleData.map(async (bundleData) => {
        console.log(bundleData, 'bundleData ID 1')
        // todo: nft_tokens is not right way to watch for NFTS
        // rethink logic of watching bundle NFTs, it's problem of smart contracts first of all
        const request = await this.getNearAccount.viewFunction(bundleData.contract, 'nft_tokens_for_owner', { account_id: bundleData.owner_id, limit: 100 })

        console.log(request, 'request ID 2')
        let requestedNFTs = request.filter((item) => {
          return passedBundleData.find((bundleItem) => bundleItem.token_id === item.token_id)
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

        // loading recursively other NFTs if there some other bundles inside
        // 2nd, 3rd level etc...
        // loading it in one array, to find later in template
        requestedNFTs.forEach(async (item) => {
          if (item.bundles && item.bundles.length) {
            const innerNFTs = await this.loadBundlesNFTsData(item.bundles, item.bundles[0].contract)

            innerNFTs.forEach((fullItem) => {
              const index = this.secondaryNFTsFullData.findIndex((_) => _.token_id === fullItem.token_id)

              if (index === -1) this.secondaryNFTsFullData.push(fullItem)
            })
          }
        })
        
      }))

      return loadedBundleNFTs
    },
    approveNFTHandler() {
      this.setNFTApproveId({
        token_id: this.NFTComputedData.token_id,
        approve_id: this.getBundleContract.contractId,
        minting_contract_id: this.NFTComputedData.contract,
      })
    },
    unbundleNFT() {
      this.triggerUnbundleNFT({
        token_id: this.NFTComputedData.token_id,
        contract_id: this.NFTComputedData.contract,
      })
    },
    changeFormat() {
      console.log('changeFormat')
    },
  },
}
</script>

<style lang="scss">
.bundle-data {
  margin-top: 50px;
}

.bundle-data__token {
  margin-right: 15px;
}

.card-placeholder {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 200px;
  width: 200px;
  margin-bottom: 15px;
  border: 1px dashed gray;
  border-radius: 4px;
  cursor: pointer;
  padding: 0 28px;
  transition: box-shadow .3s;

  .upload-icon {
    padding: 8px;
    border-radius: 4px;
    transition: background .2s ease;
  }

  &:hover {
    border: 1px solid rgba(45, 9, 73, 1);
    box-shadow: 1px 1px 4px rgba(0, 0, 0, .3);

    .upload-icon {
      background: rgba(0, 0, 0, .85);
      fill: #5ce9bc;
    }
  }
}

.nft-cards__title {
  margin-bottom: 0;

  .bundle-item & {
    margin-top: 0;
  }
}

.bundle-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  position: relative;
  margin-top: 20px;
}

.nft-cards__contract__item__inside .modal-template__body__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.nft-cards__contract__item__inside-wrap {
  width: 49%;
  margin-top: 30px;

  &:last-child {
    margin-right: 0;
  }
}
</style>