<template>
  <div class="page">
    <nav-bar :navigation="getNav"/>
    <div v-if="getNftsAreLoading" class="loading-container">
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
              :hide-approve="true"
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
            :hide-approve="true"
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
                @click="handleMint"
              >Confirm</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <modal-template
      v-if="showApproveModal"
      :is-blocked="true"
      @close="closeModal"
    >
      <template #header>
        <h3>Status of transaction</h3>
        <h3 v-if="nftObj"></h3>
      </template>
      <template #content>
        <div
          v-if="[
            StatusType.Applying,
            StatusType.Minting
          ].includes(getStatus)" class="loading-container"
        >
          <spinner :size="92" color="#000" />
          <h2>{{ statusText }}</h2>
        </div>
        <div v-else>
          <div
            class="effect-confirm__inner"
            v-if="nftObj && nftObj.metadata.media"
          >
            <h4>Picture could not appear at first, approximately 1-3 minutes for upload</h4>

            <div
              class="effect-cards-box"
          
            >
              <token-card
                :metadata="nftObj"
              />
              <button
                class="main-btn"
                @click="bundleImageApproved"
              >Submit</button>
            </div>
          </div>
        </div>
      </template>
    </modal-template>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from "vuex"
import Spinner from "@/components/Spinner"
import TokenCard from '@/components/TokenCard/TokenCard'
import NavBar from '@/components/NavBar/NavBar'
import StatusType from "@/mixins/StatusMixin"
import ModalTemplate from '@/components/ModalTemplate/ModalTemplate'
import { AppError, SystemErrors } from "@/utilities"

export default {
  name: "AddEffectConfirm",

  components: {
    Spinner,
    NavBar,
    TokenCard,
    ModalTemplate
  },

  data() {
    return {
      nftObj: {
        metadata: {
          title: '',
          description: '',
          media: '',
        },
        token_id: [],
      },
      NFTData: {},
      approvedNFTStatuses: [],
      bundlesArrApproved: null,
      showApproveModal: false,
      contractWithTokens: [],
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
    // removed watcher from mixin, because watcher triggering twice on status change
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
      'setStatus',
    ]),
    ...mapMutations([
      'CREATE_NEW_BUNDLE_WITH_APPROVE',
    ]),
    bundleStatusUpdate(data) {
      this.approvedNFTStatuses.push(data)
    },
    closeModal() {
      this.showApproveModal = false
      this.setStatus(StatusType.ChoosingParameters)
    },
    bundleImageApproved() {
      this.CREATE_NEW_BUNDLE_WITH_APPROVE({
        tokens_for_approve: 2,
        account_for_approve: process.env.VUE_APP_BUNDLE_CONTRACT,
        contract_of_tokens: this.contractWithTokens,
        token_id: `token-${Date.now()}`,
        metadata: {
          title: this.nftObj.metadata.title,
          description: this.nftObj.metadata.description,
          media: this.getDeployedPictureMeta.cid,
          copies: 1,
        },
        bundles: this.bundlesArrApproved,
      })
    },
    // minting NFT with NEW effects
    async handleMint() {
      if (!this.nftObj.metadata.title) {
        alert('Title field is empty')
      } else {
        try {
          this.showApproveModal = true

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
            this.nftObj.metadata.media = this.getDeployedPictureMeta.hashBlob
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

          this.bundlesArrApproved = bundleArr.map((item) => {
            const obj = {
              contract: item.data.contract,
              token_id: item.data.token_id,
              approval_id: item.data.approved_account_ids[this.getBundleContract.contractId] || 0,
              token_role: item.contract === 'list' ? 1 : 2,
              // cause in this case we always change owner to MAIN bundle contract
              owner_id: process.env.VUE_APP_BUNDLE_CONTRACT,
            }

            const tokensForContract = {
              contract: obj.contract,
              tokens: [obj.token_id]
            }
            
            this.contractWithTokens.push(tokensForContract)

            return obj
          })

        } catch(err) {
          this.showApproveModal = false
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