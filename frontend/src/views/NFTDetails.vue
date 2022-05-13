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
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import Spinner from "@/components/Spinner"
import { mapGetters, mapActions } from "vuex"
import NavBar from '@/components/NavBar/NavBar'
import TokenCard from '@/components/TokenCard/TokenCard'
import StatusType from "@/mixins/StatusMixin"

export default {
  name: "NFTDetails",

  components: {
    Spinner,
    NavBar,
    TokenCard,
  },

  data() {
    return {
      nftObj: {
        receiver_id: 'near_testing2.testnet',
        token_id: [],
        media: '',
      },
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
      'triggerUnbundleNFT',
    ]),
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

<style scoped lang="scss">
.bundle-data {
  margin-top: 50px;
}

.bundle-data__token {
  margin-right: 15px;
}
</style>