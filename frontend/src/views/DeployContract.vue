<template>
  <div class="page page--deploy">
    <h1>Deploy</h1>
    <div class="form-ntf__inputs">
      <span class="form-nft-send__inputs-title">Contract Wasm file</span>
      <uploader
        @selected="setUploadedImg"
        :is-file="true"
      />
    
      <span class="form-nft-send__inputs-title">Contract name</span>
      <input
        type="text"
        placeholder="Contract name"
        class="input form-nft__input"
        v-model="contractName"
      >
      <button
        class="main-btn main-btn--deploy"
        type="submit"
        @click.prevent="deploySubmit"
      >Deploy contract</button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import Uploader from '@/components/Uploader/Uploader'
import { KeyPair, connect, keyStores } from 'near-api-js'

export default {
  name: "DeployContract",

  components: {
    Uploader,
  },

  data() {
    return {
      contractVal: null,
      contractName: 'nft-list3.near_testing.testnet',
    }
  },

  computed: {
    ...mapGetters([
      'getNearAccount',
      'getCurrentWallet',
      'getContract',
    ]),
  },

  methods: {
    async deploySubmit() {
      console.log(process.env.VUE_APP_NFT_CONTRACT_KEY, 'process.env.VUE_APP_NETWORK')
      console.log(this.contractVal, 'DEPLOY')
      console.log(keyStores.KeyStore, 'keyStores')
      const ACCOUNT_ID = "near_testing.testnet"
      const credentials = JSON.parse(process.env.VUE_APP_NFT_CONTRACT_KEY)
      console.log(credentials, 'credentials')
      const keyPair = KeyPair.fromRandom("ed25519")
      console.log(keyPair.publicKey.data.toString(), 'keyPair')
      const keyStore = new keyStores.InMemoryKeyStore()
      keyStore.setKey('testnet', ACCOUNT_ID, KeyPair.fromString(credentials.private_key))
      console.log(keyStore, 'keyStore')

      const config = {
        keyStore,
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
      }
      const near = await connect(config)
      const account = await near.account(ACCOUNT_ID)
      const result = await account.createAndDeployContract(
        this.contractName,
        keyPair.publicKey,
        this.contractVal,
        "5000000000000000000000000"
      )
      console.log(result)
      console.log(result, 'result')
    },
    setUploadedImg(e) {
      const fr = new FileReader()
      fr.onload = () => {
        const data = new Uint8Array(fr.result)
        this.contractVal = data
      }
      fr.readAsArrayBuffer(e)
    }
  }
}
</script>