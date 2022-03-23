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
      <h1>Create new NFT</h1>
      <form class="form-nft">
        <uploader @selected="setUploadedImg"/>
        <div class="form-ntf__inputs">
          <span class="form-nft-send__inputs-title">Contract</span>
          <div class="select-wrap">
            <select v-model="nftObj.contract_id">
              <option v-for="(item, key) in contractsArr" :key="key" :value="item.getter">{{item.name}}</option>
            </select>
          </div>
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
          <button
            class="main-btn"
            @click.prevent="createNewNFT"
          >Submit</button>
        </div>
      </form>
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import Spinner from "@/components/Spinner"
import NavBar from '@/components/NavBar/NavBar'
import Uploader from '@/components/Uploader/Uploader'
import StatusType from "@/mixins/StatusMixin"

export default {
  name: "CreateNFT",

  components: {
    Spinner,
    NavBar,
    Uploader,
  },

  data() {
    return {
      nftObj: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
          media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/1200px-VitalikButerinProfile.jpg',
        },
        receiver_id: '',
        token_id: [],
        contract_id: 'getEffectsContract',
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
      nftArray: [],
    }
  },

  mixins: [StatusType],

  computed: {
    ...mapGetters([
      'getDeployedPictureMeta',
      'getNftsAreLoading',
      'getStatus',
      'getContract',
      'getBundleContract',
      'getEffectsContract',
    ]),
    contractsArr() {
      return [
        {
          name: this.getContract.contractId,
          getter: 'getContract',
        },
        {
          name: this.getBundleContract.contractId,
          getter: 'getBundleContract',
        },
        {
          name: this.getEffectsContract.contractId,
          getter: 'getEffectsContract',
        }
      ]
    }
  },

  methods: {
    ...mapActions([
      'createNewUsualNFT',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
    ]),
    setUploadedImg(src) {
      this.nftObj.metadata.media = src 
      this.passNFT(this.nftObj.metadata)
    },
    async createNewNFT() {
      if (!this.nftObj.metadata.title) {
        alert('Title field is emptyy')
      } else {
        await this.setResult('base64')
        await this.setDeployedPictureMeta('base64')

        this.createNewUsualNFT({
          token_id: `token-${Date.now()}`,
          metadata: {
            title: this.nftObj.metadata.title,
            description: this.nftObj.metadata.description,
            media: this.getDeployedPictureMeta,
            copies: 1,
          },
          contract_id: this.nftObj.contract_id
        })
      }
    },
  },
}
</script>
