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
      <span class="form-nft-send__inputs-title">Contract Near amount</span>
      <input
        type="number"
        placeholder="Contract Near"
        class="input form-nft__input"
        v-model="contractNear"
      >
      <span class="form-nft-send__inputs-title">Account private key for deploy</span>
      <input
        type="text"
        placeholder="Account private key"
        class="input form-nft__input"
        v-model="accountKey"
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
import { KeyPair, connect, keyStores, utils } from 'near-api-js'

export default {
  name: "DeployContract",

  components: {
    Uploader,
  },

  data() {
    return {
      contractVal: null,
      contractName: 'nft-list7.near_testing.testnet',
      contractNear: 4,
      accountKey: '',
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
      try {
        console.log(this.getNearAccount, 'getNearAccount')
        const ACCOUNT_ID = "near_testing.testnet"
        const amountInYocto = utils.format.parseNearAmount(this.contractNear.toString())
        const credentials = JSON.parse(process.env.VUE_APP_NFT_CONTRACT_KEY)
        console.log(credentials, 'credentials')
        console.log(amountInYocto, 'amountInYocto')
        const keyPair = KeyPair.fromRandom("ed25519")
        console.log(keyPair.publicKey.data.toString(), 'keyPair')

        let result = null
        const keyStore = new keyStores.InMemoryKeyStore()
        keyStore.setKey('testnet', ACCOUNT_ID, KeyPair.fromString(this.accountKey))
        console.log(keyStore, 'keyStore')

        const config = {
          keyStore,
          networkId: "testnet",
          nodeUrl: "https://rpc.testnet.near.org",
        }
        const near = await connect(config)
        const account = await near.account(ACCOUNT_ID)


        if (this.contractName === process.env.VUE_APP_NFTS_CONTRACT) {
          result = await account.deployContract(this.contractVal)
          return
        }

        result = await account.createAndDeployContract(
          this.contractName,
          keyPair.publicKey,
          this.contractVal,
          amountInYocto,
        )

        const isReady = await result.ready
        console.log(isReady, 'isReady')

        if (result) {
          this.$notify({
            group: 'deploy',
            type: 'success',
            title: 'Contract deployed:',
            text: `<a target="_blank" href="https://explorer.testnet.near.org/accounts/${result.accountId}">link to contract</a>`,
            duration: 10000,
          })
        }
        console.log(result)
        console.log(result, 'result')
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