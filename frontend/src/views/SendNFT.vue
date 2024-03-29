<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === 1" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
      <div>
        <h1 >Send NFTs</h1>
        <div
          class="form-nft-send form-nft__detail-page"
        >
          <div
            class="nft-cards"
            v-if="NFTComputedData && NFTComputedData.metadata"
          >
            <token-card
              :metadata="NFTComputedData"
              :edit-available="false"
            />
          </div>
          <div class="form-nft-send__inputs">
            <div>
              <span class="form-nft-send__inputs-title">Receipt ID</span>
              <input
                type="text"
                placeholder="Receipt ID"
                class="input form-nft__input"
                v-model="nftObj.receiver_id"
              >
            </div>
            <div class="form-nft__bottom">
              <button
                class="main-btn"
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
import { mapGetters, mapActions } from "vuex"
import Spinner from "@/components/Spinner"
import NavBar from '@/components/NavBar/NavBar'
import TokenCard from '@/components/TokenCard/TokenCard'
import StatusType from "@/mixins/StatusMixin"

export default {
  name: "SendNFT",

  components: {
    Spinner,
    NavBar,
    TokenCard,
  },

  data() {
    return {
      nftObj: {
        receiver_id: '',
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
  },

  watch: {
    getAllNFTs: {
      handler(value) {
        const data = value.find((item) => item.token_id === this.$route.params.id)
        if (this.getAllNFTs && data) {
          this.NFTData = data
          this.nftObj.media = data.metadata.media
        } else {

          // todo? router do not work in before each of router.js properly, in case, nft was approved and then sended,
          // cause near contract init earlier then app
          this.$router.push({ name: 'ChooseNFT' })
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
            duration: 3000,
          })
        }
      },
    },
  },

  methods: {
    ...mapActions([
      'setNFTApproveId',
      'sendNFTByToken',
      'getNFTByToken',
    ]),
    sendNFTHandler() {
      // if current NFT is BUNDLE, passing BUNDLE contract as trigger
      if (!this.nftObj.receiver_id) {
        alert('Receiver ID field is empty')
      } else {
        this.sendNFTByToken({
          receiver: this.nftObj.receiver_id,
          token_data: this.NFTComputedData,
          minting_contract_id: this.NFTComputedData.contract,
        })
      }
    }
  },
}
</script>