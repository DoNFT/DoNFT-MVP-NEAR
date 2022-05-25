<template>
  <div class="page page--deploy">
    <h1>EDITOR</h1>
    <div class="editor-box">
      <div id="jsoneditor" class="jsoneditor" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

export default {
  name: "DataEditor",

  data() {
    return {
      jsonObj: {},
      json: {
        'array': [1, 2, 3],
        'boolean': true,
      },
      jsoneditor: null,
      jsoneditor2: null,
      json2: {
        "array": [1, 2, 3],
        "boolean": true,
        "null": null,
        "number": 123
      }
    }
  },

  computed: {
    ...mapGetters([
      'getCurrentWallet',
      'getAllNFTs',
    ]),
  },

  methods: {
    onChangeJSON(json) {
      console.log(json, 'onChangeJSON')
      this.json2 = json
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
    console.log(this.getAllNFTs, 'getAllNFTs')

    const options = {
      mode: 'tree',
      onChangeJSON: this.onChangeJSON
    }
    const container = document.getElementById("jsoneditor")

    this.jsoneditor = new JSONEditor(container, options)
    this.jsoneditor.set(this.getAllNFTs)
  },

  // methods: {
  //   login() {
  //     login(this.getCurrentWallet)
  //   },
  // },
}
</script>

<style lang="scss">
.editor-box {
  display: flex;
  width: 100%;
}
.jsoneditor {
    border: thin solid #5ce9bc;
    height: 70vh;
    background: #fff;

    * {
      box-sizing: unset;
    }
}
.jsoneditor-menu {
    background-color: #2d0949;
}

div.jsoneditor-tree {
  padding: 15px 15px 15px 0;
}

div.jsoneditor-field, div.jsoneditor-value, div.jsoneditor td, div.jsoneditor th, div.jsoneditor textarea, pre.jsoneditor-preview, .jsoneditor-schema-error, .jsoneditor-popover {
  font-family: 'Roboto mono'
}
</style>