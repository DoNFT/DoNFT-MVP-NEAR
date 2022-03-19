<template>
  <div class="page">
    <nav-bar :navigation="getNavigation"/>
    <div v-if="[0, 2, 3, 4].includes(getStatus)" class="loading-container">
      <spinner :size="92" color="#000" />
      <h1>{{ statusText }}</h1>
    </div>
    <main v-else>
      <h1>Create new NFT</h1>
      <form class="form-nft">
        <uploader @selected="setUploadedImg"/>
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
            @click="createNewNFT"
          >Submit</button>
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

  computed: {
    ...mapGetters([
      'getDeployedPictureMeta',
      'getNftsAreLoading',
      'getStatus',
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
          text: this.statusText,
          duration: 5000,
        })
      },
    },
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
      await this.setResult('base64')
      await this.setDeployedPictureMeta('base64')
      console.log(this.getDeployedPictureMeta, 'this.getDeployedPictureMeta')
      this.createNewUsualNFT({
        token_id: `token-${Date.now()}`,
        metadata: {
          title: this.nftObj.metadata.title,
          description: this.nftObj.metadata.description,
          media: this.getDeployedPictureMeta,
          copies: 1,
        },
      })
    },
  },
}
</script>
