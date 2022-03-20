<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || [0, 2, 3, 4].includes(getStatus)" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
      <h1>Choose NFT and apply effect</h1>
      <div class="nft-cards">
        <div
          v-for="contractData in getFilteredNFTsByContract"
          :key="contractData.id"
          class="nft-cards__contract"
        >
          <template v-if="contractData.NFTS && contractData.NFTS.length">
            <h3>Contract: {{contractData.contractName}}</h3>
            <div class="nft-cards__contract-inner">
              <div
                class="nft-cards__contract__item"
                v-for="item in contractData.NFTS"
                :key="item.key"
                :class="{ 'chosen-card': cardClass(item.token_id)}"
                @click="chooseNFT(item)"
              >
                <token-card
                  :metadata="item"
                  :key="item.token_id"
                  :edit-available="true"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
      <button
        v-if="contractLimit + 1 < getNFTsByContract.length"
        @click="loadMoreNFT"
        class="main-btn main-btn--choose"
      >Get more NFT</button>
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
  name: "ChooseNFT",

  components: {
    Spinner,
    NavBar,
    TokenCard,
  },

  data() {
    return {
      nftObj: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
        },
        receiver_id: '',
        token_id: [],
      },
      notificationVisible: false,
      nftArray: [],
      urlData: [],
      contractLimit: 2,
    }
  },

  computed: {
    ...mapGetters([
      'getEffectChoice',
      'getEffects',
      'getDeployedPictureMeta',
      'getAllNFTs',
      'getNFTsByContract',
      'getNftsAreLoading',
      'getStatus',
      'getIpfs',
      'getNFTlimit',
    ]),
    getFilteredNFTsByContract() {
      let newArr = [].concat(this.getNFTsByContract).sort((a, b) => a.id - b.id)
      return newArr.slice(0, this.contractLimit + 1)
    },
    cardClass() {
      return (idx) => this.nftObj.token_id.indexOf(idx) !== -1
    },
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
        return ""
      }
    },
    getNav() {
      return [
        {
          text: 'Create New',
          name: 'CreateNFT',
          params: null,
        },
        {
          text: 'Send',
          name: 'SendNFT',
          params: {
            id: this.nftObj && this.nftObj.token_id.length === 1 ? this.nftObj.token_id[0] : null
          },
        },
        {
          text: 'Bundle',
          name: 'BundleNFT',
          params: {
            id: this.nftObj && this.nftObj.token_id.length > 1 ? this.nftObj.token_id : null
          },
        },
        {
          text: 'Add Effect',
          name: 'AddEffect',
          params: {
            id: this.nftObj && this.nftObj.token_id.length === 1 ? this.nftObj.token_id[0] : null
          },
        },
      ]
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

  mounted() {
    this.setEffects()
  },

  methods: {
    ...mapActions([
      'setResult',
      'passNFT',
      'setDeployedPictureMeta',
      'setEffectChoice',
      'createNewRandomNFT',
      'createNewUsualNFT',
      'setEffects',
      'setTokenImage',
      'passChosenTokens',
      'passNFTlimit',
      'getListOfNFT',
    ]),
    loadMoreNFT() {
      this.contractLimit += 2
    },
    // choosing NFT for applying effects, sending or bundling later
    chooseNFT(item) {
      const index = this.nftObj.token_id.findIndex((_) => _ === item.token_id)

      // Currently approving multiple NFTs is problem,
      // for this need smart contract, bundle approve + bundle sending
      if (index > -1) {
        this.nftObj.token_id.splice(index, 1)
      } else {
        this.nftObj.token_id.push(item.token_id)
      }

      // this one for single actions, send or effects page
      this.nftObj && this.nftObj.token_id.length === 1 ? this.passNFT(item) : this.passNFT({})

      // this one for bundle page
      this.passChosenTokens(this.nftObj.token_id)
    },
  },
}
</script>

<style lang="scss">
.nft-cards {
  display: flex;
  flex-wrap: wrap;
}

.nft-cards__contract {
  width: 100%;

  h3 {
    margin-bottom: 10px;
  }
}

.nft-cards__contract-inner {
  display: flex;
  flex-wrap: wrap;
}

.nft-cards__contract__item {
  width: 19%;
  min-width: 200px;
  margin-bottom: 30px;
  margin-right: 5px;
  cursor: pointer;
  transition: transform .1s ease-in-out, box-shadow .1s ease;

  &:last-child {
    margin-right: 0;
  }
}

.nft-cards__contract__item--bundle-data {
  width: 24%;
  cursor: initial;

  img {
    border: 1px solid #2d094970;
    margin-top: 15px;
    border-radius: 4px;
  }
}

.nft-cards__contract__item.chosen-card {
  box-shadow: -2px -2px 12px 11px rgba(127, 251, 255, 0.7);
  transform: scale(0.9);
  .nft-cards__info {
    opacity: 1;
  }
}

.nft-cards__media {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;

  .form-nft__detail-page & {
    width: 300px;
    height: 300px;
  }
}

h1 {
  margin-bottom: 30px;
}

</style>