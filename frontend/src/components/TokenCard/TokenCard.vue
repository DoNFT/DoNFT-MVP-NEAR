<template>
  <div class="nft-cards__media-wrap">
    <img
      class="nft-cards__media"
      :src="urlData || placeholder()"
    >

    <div v-if="isBundle">
      <!-- we can add NFT only to bundle NFT -->
      <icon
        v-if="metadata.bundles && metadata.bundles.length"
        name="pencil"
        :size="26"
        class="add-icon add-icon--edit"
        @click.native="editToken"
      />
      <icon
        name="trash"
        :size="26"
        class="delete-icon delete-icon--token"
        @click.native="removeToken"
      />
    </div>

    <div v-if="isAdding">
      <icon
        name="plus"
        :size="42"
        class="add-icon add-icon--token"
        @click.native="submitToken"
      />
    </div>

    <p class="nft-cards__title">{{metadata.metadata.title}}</p>
    <template v-if="!hideApprove && isApprovedContract && !isNFTApproved">
      <button
        class="main-btn"
        @click="approveNFTHandler"
      >Approve NFT</button>
      <p
        class="nft-cards__approve"
      >Please approve NFT first</p>
    </template>
    <router-link
      v-if="editAvailable"
      class="nft-cards__info"
      :to="{ name: 'NFTDetails', params: { id: metadata.token_id }}"
    >
      <icon name="pencil" :size="14" class="edit-icon" />
    </router-link>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex"
import { placeholder } from '@/utilities'

export default {
  name: "TokenCard",

  props: {
    metadata: Object,
    editAvailable: Boolean,
    isBundle: Boolean,
    isAdding: Boolean,
    hideApprove: Boolean,
    isApprovedContract: String,
  },

  data() {
    return {
      urlData: null,
    }
  },

  computed: {
    ...mapGetters([
      'getIpfs',
      'getBundleContract',
      'getNFTsByContract',
    ]),

    isNFTApproved() {
      if (this.metadata.approved_account_ids && this.isApprovedContract in this.metadata.approved_account_ids) {
        return true
      }

      return false
    }
  },

  mounted() {
    // case:
    // if to go to specific page with :id, refresh page, and then back to whole list, watcher do not trigger
    // only mounted request is not enough
    // todo: rethink logic of requests
    if (this.getIpfs) {
      this.loadContent()
    }
    // validation for bundle NFT page
    if (this.isApprovedContract) {
      if (this.metadata.approved_account_ids && this.isApprovedContract in this.metadata.approved_account_ids) {
        this.$emit('nft-approved-status', true)
      } else {
        this.$emit('nft-approved-status', false)
      }
    }
  },

  watch: {
    getIpfs: {
      handler(value) {
        if (value) {
          this.loadContent()
        }
      },
    },
    // when using 1 component on page, component data may update (editor page)
    // and in this case data updating, although blob image not
    metadata: {
      deep: true,
      handler(value) {
        if (value) {
          this.loadContent()
        }
      },
    },
  },

  methods: {
    ...mapActions([
      'setTokenImage',
      'setNFTApproveId',
    ]),
    editToken() {
      this.$emit('edit-token', this.metadata)
    },
    removeToken() {
      this.$emit('remove-token', this.metadata)
    },
    addToken() {
      this.$emit('add-token', this.metadata)
    },
    submitToken() {
      this.$emit('submit-token', this.metadata)
    },
    async loadContent () {
      if (this.metadata) {
        let url = null
        this.urlData = null

        // this one for showing blob image from applyEffect
        // when effect and nft were merged
        if (this.metadata.metadata && this.metadata.metadata.reference) {
          this.urlData = this.metadata.metadata.reference
          return
        }

        if (!this.urlData || this.isBundle) {
          url = await this.setTokenImage(this.metadata)
        }

        this.urlData = url ? url : null
      }
    },
    approveNFTHandler() {
      this.setNFTApproveId({
        token_id: this.metadata.token_id,
        approve_id: this.isApprovedContract,
        minting_contract_id: this.metadata.contract,
      })
    },
    placeholder
  },

}

</script>

<style lang="scss" scope>
.nft-cards__media-wrap {
  position: relative;

  .effect-cards-box & {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    p {
      margin-bottom: 20px;
      font-size: 20px;
    }
  }

  &:hover {
    .nft-cards__info {
      opacity: 1;
    }
  }
  
  .modal-template__body & {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 auto;

    .nft-cards__contract__item__inside & {
      margin: 0;
    }
  }

  .bundle-item & {
    width: 100%;
  }

  .form-nft--editor & {
    width: 48%;
  }
}

.nft-cards__info {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  right: 10px;
  top: 10px;
  border-radius: 4px;
  background: #5ce9bc;
  padding: 8px;
  opacity: .4;
  transition: background .15s ease-in-out, transform .1s ease-in, opacity .15s ease;
  
  &:hover {
    background: #2d0949;
    color: #fff;
    transform: scale(1.2);
  }
}

.nft-cards__approve {
  font-size: 16px;
  background: red;
  color: #fff;
  padding: 5px 8px;
  border-radius: 4px;
  max-width: 250px;
  cursor: text;
}

.nft-cards__title {
  .effect-cards-box & {
    padding: 0 5px;
    font-size: 16px;
  }
}
</style>