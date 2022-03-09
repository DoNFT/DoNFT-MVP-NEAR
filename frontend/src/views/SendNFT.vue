<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === 1" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1 class="h1--no-logo">{{ statusText }}</h1>
    </div>
    <main v-else>
      <div>
        <h1 class="h1--no-logo">Send NFTs</h1>
        <div
          class="form-nft-send"
        >
          <div
            class="nft-cards"
          >
            <img :src="NFTComputedData.metadata.media" class="form-nft-send__media">
          </div>
          <div class="form-nft-send__inputs">
            <input
              type="text"
              placeholder="Receiver ID"
              class="input form-nft__input"
              v-model="nftObj.receiver_id"
            >
            <div class="form-nft__bottom">
              <button
                class="main-btn"
                @click="approveNFTHandler"
                :disabled="!isNFTApproved"
              >Approve</button>
              <button
                class="main-btn"
                type="submit"
                :disabled="isNFTApproved"
                @click="sendNFTHandler"
              >Send</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import Spinner from "../components/Spinner"
import { mapGetters, mapActions } from "vuex"
import { StatusType } from "../utilities"
import NavBar from '../components/NavBar/NavBar'

export default {
  name: "SendNFT",

  components: {
    Spinner,
    NavBar,
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

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
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
        console.log(this.$route, 'router')
        console.log(data, 'data')
        this.NFTData = data
        this.nftObj.media = data.metadata.media
      },
    },
  },

  methods: {
    ...mapActions([
      'setNFTApproveId',
      'sendNFTByToken',
      'getNFTByToken',
    ]),
    chooseNFT(tokenId) {
      const index = this.nftObj.token_id.findIndex((_) => _ === tokenId)

      // need smart contracts for bundling NFT
      if (this.nftObj.token_id && this.nftObj.token_id.length > 0) {
        if (tokenId === this.nftObj.token_id[0]) {
          this.nftObj.token_id.splice(index, 1)
        }
      } else {
        this.nftObj.token_id.push(tokenId)
      }

      // Currently approving multiple NFTs is problem, for this need smart contract, bundle approve + bundle sending

      // if (index > -1) {
      //   this.nftObj.token_id.splice(index, 1)
      // } else {
      //   this.nftObj.token_id.push(tokenId)
      // }
    },
    approveNFTHandler() {
      this.setNFTApproveId(this.nftObj.token_id[0])
    },
    sendNFTHandler() {
      this.sendNFTByToken({ receiver: this.nftObj.receiver_id , token_id: this.nftObj.token_id[0]})
    }
  },
}
</script>

<style lang="scss">
.form-nft-send {
  display: flex;
}

.form-nft-send__inputs {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 20px;
}

.form-nft__bottom {
  display: flex;
  flex-direction: column;

  .main-btn:first-child {
    margin-bottom: 20px;
  }
}

.form-nft-send__media {
  display: block;
  width: 230px;
  height: 230px;
}
</style>