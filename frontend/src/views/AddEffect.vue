<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === 1" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1 class="h1--no-logo">{{ statusText }}</h1>
    </div>
    <main v-else>
      <div>
        <h1 class="h1--no-logo">Selected NFT</h1>
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
      <h1>NFT effects</h1>

      <div
        class="effect-cards-box"
        v-if="getEffects && getEffects.length && NFTComputedData"
      >
        <effect-cards
          @cardClicked="chooseEffect"
          :show-id="false"
          :cards="getEffects"
          :choice="[getEffectChoice]"
          content-type="video"
        ></effect-cards>
        <router-link
          class="main-btn"
          :to="{ name: 'AddEffectConfirm', params: {
            id: NFTComputedData.token_id,
            effectId: getEffectChoice,
          }}"
        >Submit</router-link>
      </div>
      <div v-else class="loading-container">
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
import EffectCards from "@/components/EffectCards/EffectCards.vue"

export default {
  name: "AddEffect",

  components: {
    Spinner,
    NavBar,
    EffectCards,
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
    }
  },


  mounted() {
    this.setEffects()
  },

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
      'getEffects',
      'getEffectChoice',
      'getDeployedPictureMeta',
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
    cardClass() {
      return (idx) => this.nftObj.token_id.indexOf(idx) !== -1
    },
    isNFTApproved() {
      return this.nftObj.token_id.some((token) => {
        const tokenData = this.getAllNFTs.find((item) => item.token_id === token)
        const getKeyLength = Object.keys(tokenData.approved_account_ids).length
        return getKeyLength === 0
      })
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
      'createNewRandomNFT',
    ]),
    async chooseEffect(id) {
      if (this.getEffectChoice && id === this.getEffectChoice) {
        this.setEffectChoice(null)
      } else {
        this.setEffectChoice(id)
      }
    },
  },
}
</script>

<style lang="scss">
</style>