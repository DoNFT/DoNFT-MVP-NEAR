<template>
  <div class="page">
    <nav-bar :navigation="getNavigation"/>
    <div
      v-if="[
        StatusType.Applying,
        StatusType.DeployingToIPFS,
        StatusType.DeployedToIPFS,
        StatusType.Minting
      ].includes(getStatus)"
      class="loading-container"
    >
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
      <h1>Selected NFTs</h1>
      <div
        class="nft-cards"
        v-if="getNFTsData && getNFTsData.length"
      >
        <div
          v-for="item in getNFTsData"
          :key="item.token_id"
          class="nft-cards__contract__item nft-cards__contract__item--bundle-data"
        >
          <token-card
            :metadata="item"
            :edit-available="false"
            :is-approved-contract="getBundleContract.contractId"
            @nft-approved-status="bundleStatusUpdate"
          />
        </div>
      </div>

      <form class="form-nft">
        <uploader
          @selected="setUploadedImg"
        />
        <div class="form-ntf__inputs">
          <input
            type="text"
            placeholder="NFT title"
            class="input form-nft__input"
            v-model="nftObj.metadata.title"
          >
          <textarea
            type="text"
            placeholder="NFT description"
            class="input form-nft__input form-nft__textarea"
            v-model="nftObj.metadata.description"
          />
          <button
            class="main-btn"
            type="submit"
            @click.prevent="bundleNFTs"
          >Bundle NFTs!</button>
        </div>
      </form>
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from "vuex"
import Spinner from "@/components/Spinner"
import NavBar from '@/components/NavBar/NavBar'
import Uploader from '@/components/Uploader/Uploader'
import TokenCard from '@/components/TokenCard/TokenCard'
import StatusType from "@/mixins/StatusMixin"
import { SystemErrors, AppError } from "@/utilities"

export default {
  name: "BundleNFT",

  components: {
    Spinner,
    NavBar,
    Uploader,
    TokenCard,
  },

  data() {
    return {
      nftObj: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
          media: '',
        },
        token_id: [],
      },
      savedGreeting: "",
      newGreeting: "",
      getNavigation: [
        {
          text: 'Back to Gallery',
          name: 'ChooseNFT',
        },
      ],
      notificationVisible: false,
      approvedNFTStatuses: [],
      nftArray: [],
    }
  },

  mixins: [StatusType],

  beforeMount() {
    if (this.getNFTArray && this.getNFTArray.length) {
      this.nftArray = this.getNFTArray
    } else {
      this.nftArray = sessionStorage.getItem('tokens_id').split(',')
    }
  },

  mounted() {
    this.fetchOwnerNFTs({ account: 'near_testy2.testnet', nftContract: process.env.VUE_APP_BUNDLE_CONTRACT })
  },

  computed: {
    ...mapGetters([
      'getNftsAreLoading',
      'getStatus',
      'getAllNFTs',
      'getNFTArray',
      'getAccountId',
      'getDeployedPictureMeta',
      'getDroppedImage',
      'getContract',
      'getBundleContract',
    ]),
    getNFTsData() {
      // filter Boolean fixing error on loading of All NFTs by contract
      // as order different on loading every time, some of NFT loading at the end
      if (this.getAllNFTs && this.getAllNFTs.length) {
        return this.nftArray.map((urlToken) => {
          const item = this.getAllNFTs.find((nftObj) => nftObj.token_id === urlToken)
          return item
        }).filter(Boolean)
      }
      return []
    },
    // if at least one nft is not approved, disabling btn
    checkBundleForApprove() {
      return this.approvedNFTStatuses.some((item) => item === false)
    }
  },

  // removed watcher from mixin, because watcher triggering twice on status change
  watch: {
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

  methods: {
    ...mapActions([
      'createNewBundleNFT',
      'createNewBundleWithApprove',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'fetchOwnerNFTs',
    ]),
    ...mapMutations([
      'CREATE_NEW_BUNDLE_WITH_APPROVE',
    ]),
    setUploadedImg(src) {
      this.nftObj.metadata.media = src 
      this.passNFT(this.nftObj.metadata)
    },
    bundleStatusUpdate(data) {
      this.approvedNFTStatuses.push(data)
    },
    async bundleNFTs() {
      try {
        // bundling shoung be available even when no img uploaded
        if (this.nftObj.metadata.media) {
          try {
            await this.setResult('base64')
          } catch(err) {
            if (err instanceof AppError) {
              throw err 
            } else {
              throw SystemErrors.NFT_EFFECT_CONFIRM
            }
          }

          try {
            await this.setDeployedPictureMeta('base64')
          } catch(err) {
            if (err instanceof AppError) {
              throw err 
            } else {
              throw SystemErrors.IPFS_SAVE
            }
          }
        }

        const bundleArr = this.nftArray.map((token) => {
          return this.getAllNFTs.find((item) => item.token_id === token)
        }).filter(Boolean)

        const bundlesArrApproved = bundleArr.map((item) => {
          const obj = {
            contract: item.contract,
            token_id: item.token_id,
            approval_id: 1,
          }

          return obj
        })

        console.log(this.getDeployedPictureMeta, 'this.getDeployedPictureMeta')

        if (this.checkBundleForApprove) {
          this.CREATE_NEW_BUNDLE_WITH_APPROVE({
            tokens_for_approve: this.nftArray,
            account_for_approve: process.env.VUE_APP_BUNDLE_CONTRACT,
            contract_of_tokens: this.getNFTsData[0].contract,
            token_id: `token-${Date.now()}`,
            metadata: {
              title: this.nftObj.metadata.title,
              description: this.nftObj.metadata.description,
              media: this.getDeployedPictureMeta,
              copies: 1,
            },
            bundles: bundlesArrApproved,
          })
        } else {
          this.createNewBundleNFT({
            token_id: `token-${Date.now()}`,
            metadata: {
              title: this.nftObj.metadata.title,
              description: this.nftObj.metadata.description,
              media: this.getDeployedPictureMeta,
              copies: 1,
            },
            bundles: bundlesArrApproved,
          })
        }

      } catch(err) {
        if(err instanceof AppError) {
          alert(err.message)
        } else {
          console.log(err)
          alert("Undefined error")
        }
      }
    },
  },
}
</script>