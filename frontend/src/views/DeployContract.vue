<template>
  <div class="page page--deploy">
    <h1>Deploy</h1>
    <template v-if="!isFullAccess">
      <div
        class="form-ntf__inputs"
      >
        <span class="form-nft-send__inputs-title">Account name</span>
        <input
          type="text"
          placeholder="Contract name"
          class="input form-nft__input"
          v-model="accountForLogin"
        >
        <button
          class="main-btn main-btn--deploy"
          type="submit"
          @click.prevent="loginFullAccess"
        >Login with full access</button>
      </div>
    </template>
    <template v-else>
      <div
        class="form-ntf__inputs"
      >
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
        <button
          class="main-btn main-btn--deploy"
          type="submit"
          @click.prevent="deploySubmit"
        >Deploy contract</button>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import Uploader from '@/components/Uploader/Uploader'
import { KeyPair, utils } from 'near-api-js'
import { loginFullAccess } from "@/nearConfig"

export default {
  name: "DeployContract",

  components: {
    Uploader,
  },

  data() {
    return {
      contractVal: null,
      contractName: 'nft-list12.near_testing.testnet',
      contractNear: 4,
      accountForLogin: 'near_testing.testnet',
      isFullAccess: false,
    }
  },

  computed: {
    ...mapGetters([
      'getNearAccount',
      'getCurrentWallet',
      'getContract',
    ]),
  },

  mounted(){
    this.accountForLogin = this.getContract.account.accountId
    this.contractName = `nft-list12.${this.getContract.account.accountId}`

    if (sessionStorage.getItem('near_access_key')) {
      this.isFullAccess = true
    }
  },
  //ed25519%3AYwTYzyRtYXDNSPi1aueKVeFUDMxcVkmrh3mFMBBBZ8J
  methods: {
    loginFullAccess() {
      console.log('loginFullAccess')
      this.getCurrentWallet.signOut()
      loginFullAccess(this.getCurrentWallet, this.accountForLogin)
    },
    async deploySubmit() {
      try {
        const amountInYocto = utils.format.parseNearAmount(this.contractNear.toString())
        const keyPair = KeyPair.fromRandom("ed25519")
        console.log(keyPair, 'keyPair')

        const result = await this.getNearAccount.createAndDeployContract(
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
            text: `<a class="link link--reverse" target="_blank" href="https://explorer.testnet.near.org/accounts/${result.accountId}">link to contract</a>`,
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