<template>
  <div class="page page--deploy">
    <h1>EDITOR</h1>
    <div class="editor-box">
      <div id="jsoneditor" class="jsoneditor" />
      <div id="jsoneditorHidden" class="jsoneditor--hidden" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import _ from "lodash"

import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

export default {
  name: "DataEditor",

  data() {
    return {
      jsonOnInit: {},
      jsoneditor: null,
      jsoneditor2: null,
      jsonOnChange: {}
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
    this.jsonOnInit = this.getAllNFTs
    this.jsonOnChange = this.getAllNFTs
    console.log(this.getAllNFTs, 'getAllNFTs')

    const options = {
      mode: 'tree',
      onChangeJSON: this.onChangeJSON,
      onClassName: this.onClassName,
    }
    const container = document.getElementById("jsoneditor")

    this.jsoneditor = new JSONEditor(container, options)
    this.jsoneditor.set(this.getAllNFTs)

    const optionsOnInit = {
      mode: 'tree',
    }
    const containerOnInit = document.getElementById("jsoneditorHidden")

    this.jsoneditorOnInit = new JSONEditor(containerOnInit, optionsOnInit)
    this.jsoneditorOnInit.set(this.getAllNFTs)
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

.jsoneditor--hidden {
  display: none;
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

#jsoneditor .different_element {
  background-color: #d1ff9d;
}
#jsoneditor .different_element div.jsoneditor-field,
#jsoneditor .different_element div.jsoneditor-value {
  color: #000;
}
</style>