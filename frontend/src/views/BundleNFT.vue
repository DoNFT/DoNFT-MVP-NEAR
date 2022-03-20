<template>
  <div class="page">
    <nav-bar :navigation="getNavigation"/>
    <div v-if="[0, 2, 3, 4].includes(getStatus)" class="loading-container">
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
            :disabled="checkBundleForApprove"
            @click.prevent="bundleNFTs"
          >Bundle NFTs!</button>
        </div>
      </form>
    </main>
  </div>
</template>

<script>
import Spinner from "@/components/Spinner"
import { mapGetters, mapActions } from "vuex"
import { StatusType } from "@/utilities"
import NavBar from '@/components/NavBar/NavBar'
import Uploader from '@/components/Uploader/Uploader'
import TokenCard from '@/components/TokenCard/TokenCard'

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

  beforeMount() {
    if (this.getNFTArray && this.getNFTArray.length) {
      this.nftArray = this.getNFTArray
    } else {
      this.nftArray = sessionStorage.getItem('tokens_id').split(',')
    }
    this.setEffects()
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
    statusText() {
      switch (this.getStatus) {
      case StatusType.Approving:
        return "Redirecting to Approve NFT"
      case StatusType.Applying:
        return "Applying the chosen effect..."
      case StatusType.DeployingToIPFS:
        return "Uploading the result to IPFS..."
      case StatusType.Minting:
        return "NFT Minting..."
      case StatusType.Minted:
        return "NFT successfully Minted!"
      default:
        return "Done"
      }
    },
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

  watch: {
    getStatus: {
      handler(value) {
        this.$notify({
          group: 'foo',
          type: value < 5 ? 'info' : 'success',
          title: 'Status:',
          text: this.statusText,
          duration: 5000,
        })
      },
    },
  },

  methods: {
    ...mapActions([
      'createNewBundleNFT',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'setEffects',
    ]),
    setUploadedImg(src) {
      this.nftObj.metadata.media = src 
      this.passNFT(this.nftObj.metadata)
    },
    bundleStatusUpdate(data) {
      this.approvedNFTStatuses.push(data)
    },
    async bundleNFTs() {
      await this.setResult('base64')
      await this.setDeployedPictureMeta('base64')
      const bundleArr = this.nftArray.map((token) => {
        return this.getAllNFTs.find((item) => item.token_id === token)
      }).filter(Boolean)

      const bundlesArrApproved = bundleArr.map((item) => {
        const obj = {
          ...item,
          contract: this.getContract.contractId,
          approval_id: item.approved_account_ids[this.getBundleContract.contractId],
        }

        return obj
      })

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
    },
  },
}
</script>