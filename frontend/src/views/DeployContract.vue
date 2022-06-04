<template>
  <div class="page page--deploy">
    <template>
      <div
        class="form-ntf__inputs"
      >
        <span class="form-nft-send__inputs-title">Contract Wasm file</span>
        <uploader
          @selected="setUploadFile"
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
      'getFactoryContract',
    ]),
  },

  mounted(){
    console.log(this.getNearAccount, 'getNearAccount')
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
        // const amountInYocto = utils.format.parseNearAmount(this.contractNear.toString())
        // const keyPair = KeyPair.fromRandom("ed25519")
        // console.log(keyPair, 'keyPair')

        // const result = await this.getNearAccount.createAndDeployContract(
        //   this.contractName,
        //   keyPair.publicKey,
        //   this.contractVal,
        //   amountInYocto,
        // )

        // const isReady = await result.ready
        // console.log(isReady, 'isReady')

        // if (result) {
        //   this.$notify({
        //     group: 'deploy',
        //     type: 'success',
        //     title: 'Contract deployed:',
        //     text: `<a class="link link--reverse" target="_blank" href="https://explorer.testnet.near.org/accounts/${result.accountId}">link to contract</a>`,
        //     duration: 10000,
        //   })
        // }
        console.log(this.getFactoryContract, 'this.getFactoryContract')

        const result = await this.getFactoryContract
          .get_stores_collection({
            from_index: 0,
            limit: 50,
          })
        const result2 = await this.getFactoryContract
          .get_store_by_owner({
            account_id: 'near_testy.testnet',
          })
        console.log(result, 'this.result')
        console.log(result2, 'this.result2')



        // this.getFactoryContract
        //   .create_store({
        //     owner_id: "near_testy.testnet",
        //     metadata: {
        //       spec: "nft-1.0.0",
        //       name: "subfactory5",
        //       symbol: "test2",
        //       icon: "data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAJCT/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQAAEQAAAAEAEAEAEAAAAQAQAQAQAAAAEREREQAAAAAAEAAAAAAAAAAQAAAAAAAAABEQAAEQAAAAEAEAEAEAAAAQAQAQAQAAAAEREREQAAAAAAAAEAAAAAAAAAAQAAAAAAAAERAAAAAAAAEAEAAAAAAAAQAQAAAAAAAAEQAADnnwAA228AANtvAADgHwAA+/8AAPv/AAD48wAA+20AAPttAAD8AwAA/+8AAP/vAAD/jwAA/28AAP9vAAD/nwAA",
        //       base_uri: "https://arweave.net",
        //       reference: null,
        //       reference_hash: null
        //     },
        //   }, '300000000000000', '6500000000000000000000000')
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
    setUploadFile(e) {
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