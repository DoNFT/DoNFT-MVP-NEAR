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
        v-if="addingToBundle"
        small
        @close="addingToBundle = false"
      >
        <template #header>
          <h2>Add new NFT to bundle</h2>
        </template>
        <template #content>
          <div
            class="bundle-item"
          >
            <div
              class="nft-cards__contract__item"
              v-for="item in mergedTokens"
              :key="item.token_id"
            >
              <h5>Token ID: <br> {{ item.token_id }}</h5>
              <token-card
                class="bundle-data__token"
                :metadata="item"
                :is-adding="true"
                @submit-token="createNFTforBundle"
              />
            </div>
          </div>
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
              @submit-token="removeBundleToken"
            />
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
import { AppError } from "@/utilities"

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
      addingToBundle: false,
      NFTData: {},
      bundleNFTsData: [],
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
      'getAccountId',
      'getBundleContract',
      'getNFTsByContract',
    ]),
    bundleNFTsComputedData() {
      return this.bundleNFTsData
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
      return this.getAllNFTs.find((item) => item.token_id === this.$route.params.id)
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
        if (this.getAllNFTs && data) {
          this.NFTData = data
          this.nftObj.media = data.metadata.media

          if (this.NFTComputedData.bundles && this.NFTComputedData.bundles.length) {
            this.loadBundlesNFTsData()
          }
        }
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

  mounted() {
    if (this.NFTComputedData) {
      if (this.NFTComputedData.bundles && this.NFTComputedData.bundles.length) {
        this.loadBundlesNFTsData()
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
    async createNFTforBundle(token_to_add_data) {
      console.log('cre')
      const contract_of_mint = this.getAllNFTs.find((item) => item.token_id === token_to_add_data.token_id)

      if (!this.nftObjForBundle.metadata.title) {
        alert('Title field is emptyy')
      } else {
        try {
          console.log(this.getDeployedPictureMeta, 'this.getDeployedPictureMeta')

          this.ADD_TOKEN_TO_BUNDLE({
            token_to_add_data,
            contract_of_mint: contract_of_mint ? contract_of_mint.contract : null,
            bundle_token_id: this.NFTComputedData.token_id,
          })
        } catch(err) {
          if(err instanceof AppError) {
            alert(err.message)
          } else {
            console.log(err)
            alert("Undefined error")
          }
        }
      }
    },
    removeBundleToken(remove_token_data) {
      const bundle_token_data = this.NFTComputedData.bundles.find((item) => item.token_id === remove_token_data.token_id)
      this.REMOVE_TOKEN_FROM_BUNDLE({ remove_token_data: bundle_token_data, bundle_id: this.NFTComputedData.token_id })
    },
    // requesting metadata of bundles NFT. to render them
    // todo: bundle contract could contain infinite number of nft,
    // so there can be a problem with searching for bundle nfts
    loadBundlesNFTsData() {
      const loadedBundleNFTs = []

      this.NFTComputedData.bundles.forEach(async (bundleData) => {
        const request = await this.getNearAccount.viewFunction(bundleData.contract, 'nft_tokens_for_owner', { account_id: this.getBundleContract.contractId, limit: 100 })
        console.log(request, 'request')

        let requestedNFTs = request.filter((item) => {
          return this.NFTComputedData.bundles.find((bundleItem) => bundleItem.token_id === item.token_id)
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
      })

      this.bundleNFTsData = loadedBundleNFTs
    },
    approveNFTHandler() {
      this.setNFTApproveId({
        token_id: this.NFTComputedData.token_id,
        approve_id: this.getBundleContract.contractId,
        minting_contract_id: this.NFTComputedData.contract,
      })
    },
    async unbundleNFT() {
      await this.triggerUnbundleNFT({ token_id: this.NFTComputedData.token_id, nft_data: this.NFTComputedData, bundles_data: this.bundleNFTsData})
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
</style>