<template>
  <div class="nft-cards__media-wrap">
    <img
      class="nft-cards__media"
      :src="urlData || placeholder()"
    >
    <p>{{metadata.metadata.title}}</p>
    <p
      v-if="isApprovedContract && !isNFTApproved"
      class="nft-cards__approve"
    >Please approve NFT first</p>
    <router-link
      v-if="editAvailable"
      class="nft-cards__info"
      :to="{ name: 'NFTDetails', params: { id: metadata.token_id }}"
    >
      <icon name="pencil" :size="14" class="upload-icon" />
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
    isApprovedContract: String,
  },
  data() {
    return {
      urlData: null
    }
  },

  methods: {
    ...mapActions([
      'setTokenImage'
    ]),
    async loadContent () {
      if (this.metadata) {

        // for restricting loading of extra images, when its already were loaded
        if (this.getNFTsPool && (this.getNFTsPool.length) < this.getNFTsTotal) {
          await this.setTokenImage(this.metadata)
        }

        if (this.isBundle) {
          await this.setTokenImage(this.metadata)
        }

        const url = this.getNFTsPool ? this.getNFTsPool.find((item) => item.token_id === this.metadata.token_id) : null
        this.urlData = url ? url.metadata.media_hash : null
      }
    },
    placeholder
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
      if (this.metadata.approved_account_ids && this.metadata.approved_account_ids[this.isApprovedContract]) {
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
  },

  computed: {
    ...mapGetters([
      'getIpfs',
      'getNFTsPool',
      'getAllNFTs',
      'getNFTsTotal',
    ]),

    isNFTApproved() {
      if (this.metadata.approved_account_ids && this.metadata.approved_account_ids[this.isApprovedContract]) {
        return true
      }

      return false
    }
  }
}

</script>

<style lang="scss" scope>
.nft-cards__media-wrap {
  position: relative;

  &:hover {
    .nft-cards__info {
      opacity: 1;
    }
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
  cursor: text;
}
</style>