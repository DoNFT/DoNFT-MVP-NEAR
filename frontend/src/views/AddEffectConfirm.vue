<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === 1" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
      <div class="effect-confirm">
        <div>
          <h1>Selected NFT</h1>
          <div
            class="nft-cards-box"
          >
            <div
              class="nft-cards"
              v-if="NFTComputedData && NFTComputedData.metadata"
            >
              <token-card
                class="form-nft-send__media"
                :metadata="NFTComputedData"
              />
            </div>
          </div>
        </div>
        <div class="effect-confirm__inner">
          <h1>NFT effects</h1>

          <div
            class="nft-cards"
            v-if="getEffect"
          >
            <img
              v-if="getEffect.image.endsWith('.jpg')"
              class="form-nft-send__media"
              :src="getEffect.image"
            />
            <video
              v-else
              autoplay
              loop
              class="embed-responsive-item"
            >
              <source :src="getEffect.image" type="video/mp4">
            </video>
          </div>
        </div>
        <div class="form-nft-send__inputs form-nft-send__inputs--effects">
          <span class="form-nft-send__inputs-title">Title</span>
          <input
            type="text"
            placeholder="NFT title"
            class="input form-nft__input"
            v-model="nftObj.metadata.title"
          >
          <span class="form-nft-send__inputs-title">Description</span>
          <textarea
            type="text"
            placeholder="NFT description"
            class="input form-nft__input form-nft__textarea"
            v-model="nftObj.metadata.description"
          />
          <div class="form-nft__bottom">
            <button
              class="main-btn"
              @click="handleMint"
            >Confirm</button>
          </div>
        </div>
      </div>
      <div v-if="[0, 2, 3, 4].includes(getStatus)" class="loading-container">
        <spinner :size="92" color="#000" />
        <h1>{{ statusText }}</h1>
      </div>
    </main>
  </div>
</template>

<script>
import Spinner from "@/components/Spinner"
import TokenCard from '@/components/TokenCard/TokenCard'
import { mapGetters, mapActions } from "vuex"
import { StatusType } from "@/utilities"
import NavBar from '@/components/NavBar/NavBar'

export default {
  name: "AddEffectConfirm",

  components: {
    Spinner,
    NavBar,
    TokenCard,
  },

  data() {
    return {
      nftObj: {
        metadata: {
          title: '',
          description: '',
        },
        token_id: [],
      },
      NFTData: {},
    }
  },


  mounted() {
    this.setEffects()
    this.setEffectChoice(this.$route.params.effectId)
  },

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
      'getEffect',
      'getDeployedPictureMeta',
      'getContract',
      'getBundleContract',
    ]),
    getNav() {
      return [
        {
          text: 'Back to Gallery',
          name: 'ChooseNFT',
          params: null,
        },
      ]
    },
    NFTComputedData() {
      return this.getAllNFTs.find((item) => item.token_id === this.$route.params.id)
    },
    statusText() {
      switch (this.getStatus) {
      case StatusType.Approving:
        return "Redirecting to Approve NFT Transaction"
      case StatusType.Applying:
        return "Applying the chosen effect..."
      case StatusType.DeployingToIPFS:
        return "Uploading the result to IPFS..."
      case StatusType.Minting:
        return "Minting..."
      case StatusType.Minted:
        return "Minted!"
      case StatusType.Approved:
        return "NFT transaction Succeded"
      default:
        return ""
      }
    },
  },

  watch: {
    getStatus: {
      handler(value) {
        this.$notify({
          group: 'foo',
          type: value < 5 ? 'info' : 'success',
          title: 'Status:',
          text: `${this.statusText}`,
          duration: 5000,
        })
      },
    },
    getAllNFTs: {
      handler(value) {
        const data = value.find((item) => item.token_id === this.$route.params.id)
        if (this.getAllNFTs && data) {
          this.NFTData = data
          this.nftObj.media = data.metadata.media
          this.passNFT(this.NFTComputedData.metadata)
        }
      },
    },
  },

  methods: {
    ...mapActions([
      'setEffects',
      'setEffectChoice',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'createNewBundleNFT',
    ]),
    // minting NFT with NEW effects
    async handleMint() {
      await this.setResult()
      await this.setDeployedPictureMeta()
      const bundleArr = [this.NFTComputedData]

      // TODO: make approval checking of ALL TOKENS, should be SAME
      let approval_id = null

      if (bundleArr[0].approved_account_ids) {
        approval_id = bundleArr[0].approved_account_ids[this.getBundleContract.contractId]
      }
      const newBundle = bundleArr.map((item) => ({ ...item, contract: this.getContract.contractId, approval_id }))
      console.log(bundleArr, 'bundleArr')
      console.log(approval_id, 'approval_id')
      console.log(newBundle, 'newBundle')

      this.createNewBundleNFT({
        token_id: `token-${Date.now()}`,
        metadata: {
          title: this.nftObj.metadata.title,
          description: this.nftObj.metadata.description,
          media: this.getDeployedPictureMeta,
          copies: 1,
        },
        bundles: bundleArr.map((item) => ({ ...item, contract: this.getContract.contractId, approval_id })),
      })
    },
  },
}
</script>

<style lang="scss">
.effect-confirm {
  display: flex;

  img {
    width: 250px;
    height: 250px;
  }
}

.effect-confirm__inner {
  margin-left: 50px;
}

.form-nft-send__inputs--effects {
  height: 50%;
  margin-top: auto;

}
</style>