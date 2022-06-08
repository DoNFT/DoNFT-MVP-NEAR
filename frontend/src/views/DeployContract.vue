<template>
  <div class="page">
    <nav-bar
      :navigation="getNavigation"
    />
    <div class="contracts-wrap">
      <div class="contracts-wrap__select">
        <h2>Create new collection</h2>
        <div class="form-ntf__inputs form-ntf__inputs--deploy">
          <span class="form-nft-send__inputs-title">Collection name</span>
          <input
            type="text"
            placeholder="Collection name"
            class="input form-nft__input"
            v-model="storeName"
          >
          <span class="form-nft-send__inputs-title">Collection symbol</span>
          <input
            type="text"
            placeholder="store symbol"
            class="input form-nft__input"
            maxlength="5"
            v-model="storeSymbol"
          >
          <button
            class="main-btn main-btn--inverse"
            type="submit"
            @click.prevent="deploySubmit"
          >Deploy new Collection</button>
        </div>
      </div>
      <div v-if="getUserStores && getUserStores.length">
        <h2>Your Collections</h2>
        <ul>
          <li
            v-for="(item, key) in getUserStores"
            :key="key"
            class="collection-item"
          >{{ item }}</li>
        </ul>
      </div>
      <div v-else>
        <h2>You don't have deployed Collections yet</h2>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import NavBar from '@/components/NavBar/NavBar'

export default {
  name: "DeployContract",

  components: {
    NavBar,
  },

  data() {
    return {
      contractVal: null,
      storeName: 'nft-list12',
      storeSymbol: 'stsym',
      contractNear: 4,
      accountForLogin: 'near_testing.testnet',
      isFullAccess: false,
      nftObj: {
        metadata: {
          title: 'NFT token 2 title',
          description: 'NFT token 2 description',
          media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/1200px-VitalikButerinProfile.jpg',
        },
        receiver_id: '',
        token_id: [],
        contract_id: 'nft-list.near_testing.testnet',
      },
      getNavigation: [
        {
          text: 'Back to Gallery',
          name: 'ChooseNFT',
        },
      ],
    }
  },

  computed: {
    ...mapGetters([
      'getNearAccount',
      'getContract',
      'getFactoryContract',
      'getAccountId',
      'getUserStores',
      'getMainContracts',
    ]),
  },

  mounted(){
    console.log(this.getUserStores, 'getUserStores')
  },

  methods: {
    ...mapActions([
      'createNewUsualNFT',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
    ]),
    async deploySubmit() {
      try {
        console.log(this.getFactoryContract, 'this.getFactoryContract')
        const checkForStore = await this.getFactoryContract
          .check_contains_store({
            store_id: this.storeName,
          })
        console.log(checkForStore, 'this.checkForStore')
        
        if (checkForStore) {
          alert('This contract already exist (')
          return
        }

        this.getFactoryContract
          .create_store({
            owner_id: this.getAccountId,
            metadata: {
              spec: "nft-1.0.0",
              name: this.storeName,
              symbol: this.storeSymbol,
              icon: "data:image/vnd.microsoft.icon;base64,AAABAAEAIAoAAAEAIABQBQAAFgAAACgAAAAgAAAAFAAAAAEAIAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAABICiz/Swou/zwAH/85ABr/OwAc/z0AIf9GByn/Sgwt/z8AH/86ABz/OgAa/0QGKP9LCi7/QAAn/0MAKP9JCyv/Swov/0QAJ/8/ACX/SQkt/0EAKf9BACn/SQkt/0kJLf9JCSz/SAks/0sJL/9DACn/QAAp/0oJLP9JCS7/SQkt/0sJLf9FAyT/gl5z/6ySnv+QbID/hF52/1khP/86AB7/flpt/6ySnv+dgJD/URk4/0MEJP+AbUn/dl1A/0MHKP9CACf/bEs6/4R6Tf9FCCr/cFY//4R1Sf9IDS3/TAow/0sMLv9JCi7/RgQr/3FTP/+DdUv/Rw0r/0kILf9KCS3/PQAd/5Jvgv/Iu8T/ZD9O/5d3h//5+/v/UR87/4RcdP/Kvsf/ZT9P/5t8jv/HuMH/QQgl/7jVY/+mu1v/OwAi/2A3Of/F7Gj/v+hm/0cGLP+eqVX/v+Vl/0UAJ/9DACj/QwAp/0sNLf8/ACj/mqJU/8Lpav9LDiz/Rwct/0kKLv8/AiX/xrW//1snQ/86AB3/NAAY/7yrt/9eK0f/wKm2/2UwSv87ABz/NQAV/76stv9rPFf/prpV/5ugV/9KFST/ttVk/8b2Z/+y0F3/SQgr/5WZUf+83mH/cVE9/29TQ/9mQTv/TAkv/0AAJf+SlVH/ttZj/0wOKv9HBy7/SQot/zwAH//Brbn/ek1k/y8AEP9DCCn/1MnR/1cjP/+4n67/f1hu/zEAD/9CBSX/zb7G/14tR/+pvVj/pbBY/6GuVf+732X/n6xU/7rdZP9HByr/lZdQ/8X0Zf+52mf/w+tp/6OtXf9ICC7/RAQn/5SZUf+42WT/TREr/0kKL/9JCi3/QgMj/2s/V//Rxs7/l4CJ/7agrf/l4+b/WCFB/18ySf/Oxc7/loGI/72vuP+ihpj/PgIb/6i5Xv/C7mT/yfZs/2RAOP+Cdkj/vuZl/0UEKv+YnFH/tNNg/0UDKf9DAiX/QwEo/0UAKv8zAB//kY5R/7jWZP9AACX/PwAn/0kILv9MCy3/QQAh/1YfPf+BWHH/XSlE/7Kdq/9rO1X/OAAb/1QdOv97WG3/bT1V/z8BI/9GCCb/qsJe/83/bf+EdUf/NwAh/5CQUP/E8Gj/RgUq/5qiUv/F8mf/ioNL/4yES/+Ef0n/fnBH/4uGS/+xy17/wepm/5CPTv+CeEn/SQ4v/0kILf9LDC3/RgQp/z8AIP84ABn/uqSy/2c3Uf9FAib/Rwcq/z8AHf9BACL/Swwt/0cIJv+VlFX/kYpS/0YEJv9CAyn/e2dG/6KsWv9GByr/gnJI/6m7XP+ovFv/rMBf/6W0W/+WmlP/r8Jh/6OzV/+grlb/rMNd/5qlWP9JEC7/SQks/0kJLP9KCi3/TAwu/0cJLP9XID//TxAx/0gHK/9JCi3/Swwu/0oLLv9KCSz/Sgks/0EFKP9CACb/SQkt/0oIMP9HBSr/RAIp/0gJLf9EBSr/QwIo/0EAKP9CACj/QwAo/0QBKP9BACf/QwEp/0QCKv9BACj/QwAp/0kILf9JCSz/SQks/0kJLP9JCSz/SAks/0YDJ/9JByv/SAks/0kJLP9JCSz/SQks/0kKK/9JCir/Swot/0sLLv9JCiz/SAsq/0kKLv9NCi7/SAor/0wJLv9LCi//SQov/0oKL/9LCi7/Swou/0oKL/9KCi//Sgov/0oKLv9KCi7/SQkt/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
              base_uri: null,
              reference: null,
              reference_hash: null
            },
          }, '300000000000000', '6500000000000000000000000')
      } catch(err) {
        console.log(err.message, 'err2')
        this.$notify({
          group: 'deploy',
          type: 'error',
          title: 'Error:',
          text: err.message,
          duration: 10000,
        })
      }
    },
    setUploadFile(src) {
      this.nftObj.metadata.media = src 
      this.passNFT(this.nftObj.metadata)
    },
  }
}
</script>