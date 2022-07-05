<template>
  <div class="page">
    <nav-bar
      :navigation="getNav"
      :show-generate-nft="true"
      @generate-random-nft="generateRandomNFT"
    />
    <div
      v-if="[
        StatusType.Applying,
        StatusType.DeployingToIPFS,
        StatusType.DeployedToIPFS,
        StatusType.Minting
      ].includes(getStatus)" class="loading-container"
    >
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
                :key="`nft--${item.token_id}`"
                :class="{ 'chosen-card': cardClass(item.token_id)}"
                @click="chooseNFT(item)"
              >
                <token-card
                  :metadata="item"
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
import NavBar from '@/components/NavBar/NavBar'
import StatusType from "@/mixins/StatusMixin"
import { AppError, SystemErrors } from "@/utilities"

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
      randomNFTsData: {
        metadata: {
          title: '',
          description: '',
          media: '',
          copies: 1,
        },
      },
      notificationVisible: false,
      nftArray: [],
      urlData: [],
      contractLimit: 2,
      getErrorStatus: 0,
    }
  },

  mixins: [StatusType],

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

  computed: {
    ...mapGetters([
      'getEffectChoice',
      'getDeployedPictureMeta',
      'getAllNFTs',
      'getNFTsByContract',
      'getNftsAreLoading',
      'getStatus',
      'getIpfs',
      'getNFTlimit',
      'getContract'
    ]),
    getFilteredNFTsByContract() {
      let newArr = [].concat(this.getNFTsByContract).sort((a, b) => a.id - b.id)
      return newArr.slice(0, this.contractLimit + 1)
    },
    cardClass() {
      return (idx) => this.nftObj.token_id.indexOf(idx) !== -1
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
        {
          text: 'Editor',
          name: 'DataEditor',
          params: null,
        },
        {
          text: 'Deploy store',
          name: 'DeployContract',
          params: null,
        },
      ]
    }
  },

  methods: {
    ...mapActions([
      'passNFT',
      'passChosenTokens',
      'passNFTlimit',
      'setResult',
      'setDeployedPictureMeta',
      'createNewUsualNFT',
    ]),
    async getBase64FromUrl(url) {
      const data = await fetch(url)
      const blob = await data.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob) 
        reader.onerror = () => {
          throw SystemErrors.GET_BASE_64
        }
        reader.onloadend = () => {
          const base64data = reader.result   
          resolve(base64data)
        }
      })
    },

    // Creating Random NFT, depend on Math random
    // currently only for VUE_APP_NFTS_CONTRACT and VUE_APP_NFTS_EFFECTS_CONTRACT
    async generateRandomNFT(nftType) {
      try {
        let contract_id = process.env.VUE_APP_NFTS_CONTRACT
        let randomNumber = Math.floor(Math.random() * 5)
        let randomImage =  require(`@/assets/randomNFT/${randomNumber}.jpg`)
        let imageBase64 = null

        if (nftType === 'effectNFT') {
          contract_id = process.env.VUE_APP_NFTS_EFFECTS_CONTRACT
          randomNumber = Math.floor(Math.random() * 7)
          randomImage =  require(`@/assets/randomEffectNFT/${randomNumber}.jpg`)
        }

        try {
          imageBase64 = await this.getBase64FromUrl(randomImage)
        } catch(err) {
          if (err instanceof AppError) {
            throw err 
          } else {
            throw SystemErrors.GET_BASE_64
          }
        }

        this.randomNFTsData = {
          metadata: {
            title: `Title of ${randomNumber} random NFT`,
            description: `Description of ${randomNumber} random NFT`,
            media: imageBase64,
            copies: 1,
          },
        }

        this.passNFT(this.randomNFTsData.metadata)

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

        await this.createNewUsualNFT({
          token_id: `token-${Date.now()}`,
          metadata: {
            ...this.randomNFTsData.metadata,
            media: this.getDeployedPictureMeta,
          },
          contract_id,
        })
      } catch(err) {
        console.log(err, 'MAIN ERROR')
        // if(err instanceof AppError) {
        //   alert(err.message)
        // } else {
        //   console.log(err)
        //   alert("Undefined error")
        // }
      }
    },
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
  align-items: center;

  .bundle-item & {
    justify-content: space-between;
  }
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

  .bundle-item & {
    width: 49%;
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
  box-shadow: 0px 0px 5px 6px rgba(127, 251, 255, 0.7);
  transform: scale(0.9);
  .nft-cards__info {
    opacity: 1;
  }
}

.nft-cards__media {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: contain;

  .modal-template__body & {
    height: 350px;
    margin: 30px 0;
  }

  .form-nft__detail-page & {
    width: 300px;
    height: 300px;
  }

  .bundle-item & {
    margin-bottom: 0;
  }

  .form-nft--editor & {
    height: auto;
  }
}

h1 {
  margin-bottom: 30px;
}

</style>