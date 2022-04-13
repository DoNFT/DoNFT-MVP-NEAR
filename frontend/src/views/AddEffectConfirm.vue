<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading || getStatus === StatusType.Approving" class="loading-container">
      <spinner :size="92" color="#000" />
      <h2>{{ statusText }}</h2>
    </div>
    <main v-else>
      <div class="effect-confirm">
        <div class="effect-confirm__selected">
          <h2>Selected NFT</h2>
          <div
            class="nft-cards-box"
          >
            <token-card
              v-if="NFTComputedData && NFTComputedData.metadata"
              :metadata="NFTComputedData"
              :is-approved-contract="getBundleContract.contractId"
              @nft-approved-status="bundleStatusUpdate"
            />
          </div>
        </div>
        <div class="effect-confirm__selected">
          <h2>NFT effects</h2>

          <token-card
            v-if="getEffect"
            :metadata="getEffect"
            :is-approved-contract="getBundleContract.contractId"
            @nft-approved-status="bundleStatusUpdate"
          />
        </div>
        <div class="form-nft-send__inputs form-nft-send__inputs--effects">
          <h2>Bundle metadata</h2>
          <div class="effect-form-wrap">
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
                :disabled="checkBundleForApprove"
                @click="handleMint"
              >Confirm</button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="[
          StatusType.Applying,
          StatusType.DeployingToIPFS,
          StatusType.DeployedToIPFS,
          StatusType.Minting
        ].includes(getStatus)" class="loading-container"
      >
        <spinner :size="92" color="#000" />
        <h2>{{ statusText }}</h2>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import Spinner from "@/components/Spinner"
import TokenCard from '@/components/TokenCard/TokenCard'
import NavBar from '@/components/NavBar/NavBar'
import StatusType from "@/mixins/StatusMixin"
import { AppError, SystemErrors } from "@/utilities"

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
      approvedNFTStatuses: [],
    }
  },

  mixins: [StatusType],

  computed: {
    ...mapGetters([
      'getAllNFTs',
      'getNftsAreLoading',
      'getStatus',
      'getEffect',
      'getDeployedPictureMeta',
      'getContract',
      'getBundleContract',
      'getEffectsContract',
      'getAccountId',
    ]),
    // if at least one nft is not approved, disabling btn
    checkBundleForApprove() {
      return this.approvedNFTStatuses.some((item) => item === false)
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
  },

  watch: {
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

  mounted() {
    this.setEffectChoice(this.$route.params.effectId)
  },

  methods: {
    ...mapActions([
      'setEffectChoice',
      'setEffectResult',
      'setDeployedPictureMeta',
      'passNFT',
      'createNewBundleNFT',
    ]),
    bundleStatusUpdate(data) {
      this.approvedNFTStatuses.push(data)
    },
    // minting NFT with NEW effects
    async handleMint() {
      if (!this.nftObj.metadata.title) {
        alert('Title field is empty')
      } else {
        try {
          const effectObj = {
            original: {
              contract: this.getContract.contractId,
              tokenId: this.NFTComputedData.token_id,
              contentUrl: this.NFTComputedData.metadata.media,
            },
            modificator: {
              contract: this.getEffectsContract.contractId,
              tokenId: this.getEffect.token_id,
              contentUrl: this.getEffect.metadata.media,
            },
            sender: this.getAccountId,
          }

          try {
            await this.setEffectResult(effectObj)
          } catch(err) {
            console.log(err)
            if (err instanceof AppError) {
              throw err 
            } else {
              throw SystemErrors.NFT_EFFECT_CONFIRM
            }
          }


          const bundleArr = [
            {
              data: this.NFTComputedData,
              contract: 'list',
            },
            {
              data: this.getEffect,
              contract: 'effects',
            }
          ]

          const bundlesArrApproved = bundleArr.map((item) => {
            const obj = {
              ...item.data,
              contract: item.contract === 'list' ? this.getContract.contractId : this.getEffectsContract.contractId,
              approval_id: item.data.approved_account_ids[this.getBundleContract.contractId],
            }

            return obj
          })

          // its calling bundle, because effect NFT combining with usual NFT


          try {
            await this.createNewBundleNFT({
              token_id: `token-${Date.now()}`,
              metadata: {
                title: this.nftObj.metadata.title,
                description: this.nftObj.metadata.description,
                media: this.getDeployedPictureMeta,
                copies: 1,
              },
              bundles: bundlesArrApproved,
            })
          } catch(err) {
            console.log(err)
            if (err instanceof AppError) {
              throw err 
            } else {
              throw SystemErrors.BUNDLE_NFTS
            }
          }
        } catch(err) {
          if(err instanceof AppError) {
            alert(err.message)
          } else {
            console.log(err)
            alert("Undefined error")
          }
        }
      }
    },
  },
}
</script>

<style lang="scss">
</style>