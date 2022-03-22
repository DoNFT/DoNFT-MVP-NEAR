<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === 1" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
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

      <div
        class="effect-cards-box"
        v-if="effectContractNFTData && effectContractNFTData.NFTS.length && NFTComputedData"
      >
        <h1 class="h1--effects">NFT effects</h1>
        <effect-cards
          @card-clicked="chooseEffect"
          :show-id="false"
          :cards="filterEffectsContractCards"
          :choice="[getEffectChoice]"
          content-type="video"
        ></effect-cards>
        <router-link
          class="main-btn"
          tag="button"
          :disabled="!getEffectChoice"
          :to="{ name: 'AddEffectConfirm', params: {
            id: NFTComputedData.token_id,
            effectId: getEffectChoice,
          }}"
        >Submit</router-link>
      </div>
      <div v-else>
        <h1 class="effect-cards-box__no-effect">You have no effects</h1>
        <h2>Add some effects here</h2>
        <router-link
          class="main-btn main-btn--no-effect"
          tag="button"
          :to="{ name: 'CreateNFT'}"
        >Create Effect</router-link>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import Spinner from "@/components/Spinner"
import TokenCard from '@/components/TokenCard/TokenCard'
import NavBar from '@/components/NavBar/NavBar'
import EffectCards from "@/components/EffectCards/EffectCards.vue"
import StatusType from "@/mixins/StatusMixin"

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

  mixins: [StatusType],

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
      'getEffect',
      'getEffectChoice',
      'getDeployedPictureMeta',
      'getEffectsContract',
      'getNFTsByContract',
    ]),
    filterEffectsContractCards() {
      return this.effectContractNFTData.NFTS.filter((item) => {
        if (item.token_id !== this.NFTComputedData.token_id) {
          return item
        }
      })
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
    NFTComputedData() {
      return this.getAllNFTs.find((item) => item.token_id === this.$route.params.id)
    },
    effectContractNFTData() {
      return this.getNFTsByContract.find((item) => item.contractName === this.getEffectsContract.contractId)
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
      'setEffectChoice',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'createNewRandomNFT',
    ]),
    async chooseEffect(card) {
      if (this.getEffectChoice && card.token_id === this.getEffectChoice) {
        this.setEffectChoice(null)
      } else {
        this.setEffectChoice(card.token_id)
      }
    },
  },
}
</script>

<style lang="scss">
</style>