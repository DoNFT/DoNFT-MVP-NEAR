<template>
  <div class="page page--deploy">
    <h1>EDITOR</h1>
    <div class="editor-box">
      <div class="editor-box__main">
        <div id="jsoneditor" class="jsoneditor" />
        <div id="jsoneditorHidden" class="jsoneditor--hidden" />
      </div>
      <div class="editor-box__preview">
        <div
          v-if="showAddNFTForm"
        >
          <div
            class="editor-box__preview-close"
            @click="closeModal"
          >
            <icon name="cross" :size="32" class="cross-icon" />
          </div>
          <form
            class="form-nft form-nft--editor"
          >
            <uploader @selected="setUploadedImg"/>
            <div class="form-ntf__inputs">
              <span class="form-nft-send__inputs-title">Contract</span>
              <input
                type="text"
                placeholder="NFT Contract"
                class="input form-nft__input"
                v-model="nftObj.contract_id"
              >
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
              <button
                class="main-btn"
                @click.prevent="createNewNFT"
              >Submit</button>
            </div>
          </form>
        </div>

        <div
          v-if="showSendNFTForm"
        >
          <div
            class="editor-box__preview-close"
            @click="closeModal()"
          >
            <icon name="cross" :size="32" class="cross-icon" />
          </div>
          <div
            class="form-nft-send form-nft__detail-page"
          >
            <div
              class="nft-cards"
              v-if="NFTComputedData && NFTComputedData.metadata"
            >
              <token-card
                :metadata="NFTComputedData"
                :edit-available="false"
              />
            </div>
            <div class="form-nft-send__inputs">
              <div>
                <span class="form-nft-send__inputs-title">Receipt ID</span>
                <input
                  type="text"
                  placeholder="Receipt ID"
                  class="input form-nft__input"
                  v-model="nftObj.receiver_id"
                >
              </div>
              <div class="form-nft__bottom">
                <button
                  class="main-btn"
                  @click="sendNFTHandler"
                >Send</button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showDeployContract"
        >
          <div
            class="editor-box__preview-close"
            @click="closeModal()"
          >
            <icon name="cross" :size="32" class="cross-icon" />
          </div>
          <template v-if="!isFullAccess">
            <h1>Login with full access first</h1>
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
              <!-- <button
                  class="main-btn main-btn--deploy"
                  type="submit"
                  @click.prevent="loginFullAccess"
                >Login with full access</button> -->
            </div>
          </template>
          <template v-else>
            <h1>Deploy contract</h1>
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
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import _ from "lodash"
import { AppError } from "@/utilities"
import Uploader from '@/components/Uploader/Uploader'
import TokenCard from '@/components/TokenCard/TokenCard'
import { KeyPair, utils } from 'near-api-js'
import { loginFullAccess } from "@/nearConfig"

import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

export default {
  name: "DataEditor",

  components: {
    Uploader,
    TokenCard,
  },

  data() {
    return {
      jsonOnInit: {},
      jsoneditor: null,
      jsoneditor2: null,
      jsonOnChange: {},
      showAddNFTForm: false,
      showSendNFTForm: false,
      showDeployContract: false,
      currentToken: 'token-1652965846149',
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
      contractVal: null,
      contractName: 'nft-list12.near_testing.testnet',
      contractNear: 4,
      accountForLogin: 'near_testing.testnet',
      isFullAccess: false,
    }
  },

  computed: {
    ...mapGetters([
      'getCurrentWallet',
      'getAllNFTs',
      'getNFTsByContract',
      'getContract',
    ]),
    getFilteredNFTsByContract() {
      const editorObj = {
        contracts: {}
      }
      const sortedByIdContracts =  [].concat(this.getNFTsByContract).sort((a, b) => a.id - b.id)
      sortedByIdContracts.forEach((item) => {

        const obj = {
          [item.contractName]: {
            tokens: {}
          }
        }

        item.NFTS.forEach((nftData) => {
          const nftObj = {
            [nftData.metadata.title]: {
              bundles: []
            }
          }

          if (nftData.bundles && nftData.bundles.length) {
            nftData.bundles.forEach((bundleData) => {
              console.log(bundleData, 'bundleData')
              console.log(nftObj[nftData.metadata.title].bundles, 'nftObj[nftData.metadata.title].bundles')
              nftObj[nftData.metadata.title].bundles.push(bundleData.token_id)
            })
          }

          Object.assign(obj[item.contractName].tokens, nftObj)


        })
        Object.assign(editorObj.contracts, obj)

        return editorObj
      })
      console.log(editorObj, 'editorObj')

      return editorObj
    },
    NFTComputedData() {
      return this.getAllNFTs.find((item) => item.token_id === this.currentToken)
    },
  },

  methods: {
    ...mapActions([
      'createNewUsualNFT',
      'setResult',
      'setDeployedPictureMeta',
      'passNFT',
      'setNFTApproveId',
      'sendNFTByToken',
      'getNFTByToken',
    ]),
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
    setUploadFile(e) {
      const fr = new FileReader()
      fr.onload = () => {
        const data = new Uint8Array(fr.result)
        this.contractVal = data
      }
      fr.readAsArrayBuffer(e)
    },
    closeModal() {
      this.showAddNFTForm = false
      this.showSendNFTForm = false
      this.showDeployContract = false
    },
    setUploadedImg(src) {
      this.nftObj.metadata.media = src 
      this.passNFT(this.nftObj.metadata)
    },
    sendNFTHandler() {
      // if current NFT is BUNDLE, passing BUNDLE contract as trigger
      if (!this.nftObj.receiver_id) {
        alert('Receiver ID field is empty')
      } else {
        this.sendNFTByToken({
          receiver: this.nftObj.receiver_id,
          token_data: this.NFTComputedData,
          minting_contract_id: this.NFTComputedData.contract,
        })
      }
    },
    async createNewNFT() {
      if (!this.nftObj.metadata.title) {
        alert('Title field is emptyy')
      } else {
        try {
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
            contract_id: this.nftObj.contract_id
          })
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
    onChangeJSON(json) {
      console.log(json, 'onChangeJSON')
      this.jsonOnChange = json
    },
    onClassName({ path }) {
      console.log(path, 'PATH')
      const leftValue = _.get(this.jsonOnInit, path)
      const rightValue = _.get(this.jsonOnChange, path)

      return _.isEqual(leftValue, rightValue)
        ? 'the_same_element'
        : 'different_element'
    },
    resetModals() {
      this.showAddNFTForm = false
      this.showSendNFTForm = false
      this.showDeployContract = false
    },
    onTextareaChange(e) {
      console.log(typeof this.json2, 'CHANGE')
      console.log(this.json, 'CHANGE json2')

      if (typeof e.target.value === 'string') {
        this.jsoneditor.updateText(e.target.value)
      }

      if (typeof e.target.value === 'object') {
        this.jsoneditor.set(e.target.value)
      }
    },
  },

  mounted() {
    this.accountForLogin = this.getContract.account.accountId
    this.contractName = `nft-list12.${this.getContract.account.accountId}`

    if (sessionStorage.getItem('near_access_key')) {
      this.isFullAccess = true
    }
    this.jsonOnInit = this.getFilteredNFTsByContract
    this.jsonOnChange = this.getFilteredNFTsByContract
    console.log(this.getAllNFTs, 'getAllNFTs')
    const self = this

    const options = {
      mode: 'tree',
      onChangeJSON: this.onChangeJSON,
      onClassName: this.onClassName,

      onCreateMenu: function (items, node) {
        const path = node.path

        // log the current items and node for inspection
        console.log('items:', items, 'node:', node)

        function addNewNFT() {
          self.resetModals()
          self.showAddNFTForm = true
        }

        function sendNFT() {
          self.resetModals()

          const name = path[path.length - 1]

          self.currentToken = self.getAllNFTs.find((item) => {
            if (item.metadata.title === name) {
              return item
            }
          }).token_id

          self.showSendNFTForm = true
        }

        function addContract() {
          self.resetModals()

          self.showDeployContract = true
        }

        if (path) {
          console.log('path:', path)
          // if last item in tree array is bundles, we able to add NFT
          if (path[path.length - 1] === 'bundles') {
            console.log('path.length === 1', path.length === 1)
            items.push({
              text: 'Add NFT',
              title: 'Add NFT to contract',
              className: 'add-btn',
              click: addNewNFT
            })
          }

          // if startwith token-, its NFT, and we can send it
          if (path[path.length - 1].startsWith('token-')) {
            items.push({
              text: 'Send NFT',
              title: 'Send NFT',
              className: 'add-btn',
              click: sendNFT
            })
          }

          // if wrapper is equal to tokens, NFT choosen
          if (path[path.length - 2] === 'tokens') {
            items.push({
              text: 'Send NFT',
              title: 'Send NFT',
              className: 'add-btn',
              click: sendNFT
            })
          }

          // if wrapper is equal to contracts, Contracts choosen
          if (path[path.length - 1] === 'contracts') {
            items.push({
              text: 'Add Contract',
              title: 'Add Contract',
              className: 'add-btn',
              click: addContract
            })
          }
        }


        console.log('items', items)
        // Now we will iterate through the menu items, which includes the items
        // created by jsoneditor, and the new item we added above. In this
        // example we will just alter the className property for the items, but
        // you can alter any property (e.g. the click callback, text property etc.)
        // for any item, or even delete the whole menu item.
        items.forEach(function (item, index, items) {
          if ("submenu" in item) {
          // if the item has a submenu property, it is a submenu heading
          // and contains another array of menu items. Let's colour
          // that yellow...
            items[index].className += ' submenu-highlight'
          } else {
          // if it's not a submenu heading, let's make it colorful
            items[index].className += ' rainbow'
          }
        })

        // note that the above loop isn't recursive, so it only alters the classes
        // on the top-level menu items. To also process menu items in submenus
        // you should iterate through any "submenu" arrays of items if the item has one.

        // next, just for fun, let's remove any menu separators (again just at the
        // top level menu). A menu separator is an item with a type : 'separator'
        // property
        items = items.filter(function (item) {
          return item.type !== 'separator'
        })

        // finally we need to return the items array. If we don't, the menu
        // will be empty.
        return items
      }
    }
    const container = document.getElementById("jsoneditor")

    this.jsoneditor = new JSONEditor(container, options)
    this.jsoneditor.set(this.getFilteredNFTsByContract)

    const optionsOnInit = {
      mode: 'tree',
    }
    const containerOnInit = document.getElementById("jsoneditorHidden")

    this.jsoneditorOnInit = new JSONEditor(containerOnInit, optionsOnInit)
    this.jsoneditorOnInit.set(this.getFilteredNFTsByContract)
  },
}
</script>

<style lang="scss">
.editor-box {
  display: flex;
  width: 100%;
}

.editor-box__main {
  width: 40%;
}

.editor-box__preview {
  position: relative;
  width: 60%;
  margin-left: 20px;
}

.jsoneditor--hidden {
  display: none;
}

.jsoneditor {
    border: thin solid #5ce9bc;
    height: 70vh;
    background: #fff;
}
.jsoneditor-menu {
    background-color: #2d0949;
}

div.jsoneditor-tree {
  padding: 15px 0 0 0;
}

div.jsoneditor-field, div.jsoneditor-value, div.jsoneditor td, div.jsoneditor th, div.jsoneditor textarea, pre.jsoneditor-preview, .jsoneditor-schema-error, .jsoneditor-popover {
  font-family: 'Roboto mono'
}

#jsoneditor .different_element {
  background-color: #d1ff9d;
}
#jsoneditor .different_element div.jsoneditor-field,
#jsoneditor .different_element div.jsoneditor-value {
  color: #000;
}

.add-btn--disabled {
  color: #c8c8c8!important;
  cursor: not-allowed!important;
  
  .jsoneditor-icon {
    opacity: .3;
  }
}

.editor-box__preview-close {
  position: absolute;
  right: -5px;
  top: -20px;
  cursor: pointer;


  &:hover {
    color: red;
    fill: red;
  }
}
</style>