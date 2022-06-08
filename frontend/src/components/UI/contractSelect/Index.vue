
<template>
  <div class="custom-select" :class="[`custom-select_mode-${mode}`]" @click.stop>
    <div class="custom-select__view">
      <div class="custom-select__view-selected">
        <input class="input" type="text" readonly :value="modelValue" :placeholer="'search'">
      </div>
      <div class="custom-select__view-search">
        <input class="input" type="text" v-model.trim="searchContract" ref="searchInputElement" :placeholder="'search'">
      </div>
      <span class="custom-select__view-arrow">
        <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.3536 0.853553C11.5488 0.658291 11.5488 0.341709 11.3536 0.146447C11.1583 -0.0488155 10.8417 -0.0488155 10.6464 0.146447L11.3536 0.853553ZM6 5.5L5.64645 5.85355C5.74022 5.94732 5.86739 6 6 6C6.13261 6 6.25979 5.94732 6.35355 5.85355L6 5.5ZM1.35355 0.146447C1.15829 -0.0488155 0.841709 -0.0488155 0.646447 0.146447C0.451184 0.341709 0.451184 0.658291 0.646447 0.853553L1.35355 0.146447ZM10.6464 0.146447L5.64645 5.14645L6.35355 5.85355L11.3536 0.853553L10.6464 0.146447ZM6.35355 5.14645L1.35355 0.146447L0.646447 0.853553L5.64645 5.85355L6.35355 5.14645Z"></path></svg>
      </span>
      <div class="custom-select__view-choose" @click="openOptions"></div>
    </div>
    <div class="custom-select__options">
      <template v-if="viewContractsList && viewContractsList.length">
        <div
          class="option"
          v-for="contract in viewContractsList"
          :key="contract.address"
          @click="selectContract(contract.address)"
        >
          <div v-text="contract.address"></div>
        </div>
      </template>
      <div v-else class="custom-select__options-notice">Contract not loaded</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: "select-component",
  props: {
    modelValue: {
      type: String,
      default: '',
    }
  },

  data() {
    return {
      mode: 'choose',
      searchContract: '',
      searchInputElement: null,
    }
  },

  mounted() {
    document.addEventListener('click', this.closeOptions)
  },

  computed: {
    ...mapGetters([
      'getMainContracts',
      'getUserStores',
      'getActiveContract'
    ]),
    contractsOption() {
      const mergedContracts = [...this.getMainContracts, ...this.getUserStores]
      console.log(mergedContracts, 'mergedContracts')

      return mergedContracts.map((contract, index) => ({ address: contract, id: index }))
    },

    viewContractsList() {
      const query = this.searchContract.toLowerCase()
      if(query.length > 2){
        return this.contractsOption.filter(contract => {
          return contract.address.toLowerCase().includes(query)
        })
      }
      return this.contractsOption
    }
  },
  methods: {
    generateRandomNFT(val) {
      this.$emit("generate-random-nft", val)
    },
    openOptions() {
      console.log('openOptions')
      this.mode = 'choose-open'
      this.$nextTick(() => this.$refs.searchInputElement.focus())
    },
    closeOptions() {
      this.mode = 'choose'
    },
    selectContract(contractAddress) {
      this.$emit('change', contractAddress)
      this.searchContract = ''
      this.closeOptions()
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-select{
  position: relative;
  background: #fff;
  z-index: 2;

  &__view{
    position: relative;

    &-arrow{
      position: absolute;
      right: 15px;
      top: 17px;
      width: 12px;
      cursor: pointer;

      svg{
        display: block;
        width: 100%;

        path{
          fill: #000
        }
      }
    }
    &-choose{
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .input{
      width: 100%;
      border-radius: 8px;
      height: 40px;
      font-size: 20px;
      line-height: 20px;
      padding: 0 40px 0 10px;
      background: transparent;
      color: #000;
      border: 0;
    }
  }

  &__options{
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    max-height: 200px;
    overflow: auto;
    color: #000;
    background: #2d0949;
    padding: 10px 0;
    border-radius: 8px;

    .option{
      padding: 10px 15px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;

      div{
        color: #fff;
        font-weight: 500;
        font-size: 14px;
        line-height: 17px;


        &:first-child{
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:nth-child(2){
          padding-left: 20px;
        }
      }

      &:hover{
        background: #5ce9bc;
        
        div:first-child{
          color: #000;
        }
      }
    }

    &-notice,
    &-add{
      padding: 0 15px;
      color: #fff;
      opacity: .5;
      font-weight: 500;
      font-size: 14px;
      line-height: 17px;
    }

    &-add{
      color: #fff;
      opacity: 1;
      cursor: pointer;

      span{
        color: #fff
      }

      div{
        color: var(--marked-second-color);
        padding-top: 3px;
      }

    }
  }


  &_mode-choose &__view-choose{
    display: block;
  }
  &_mode-choose &__view-selected{
    display: block;
  }
  &_mode-choose &__view-search{
    display: none;
  }
  &_mode-choose &__options{
    display: none;
  }


  &_mode-choose-open &__view-choose{
    display: none;
  }
  &_mode-choose-open &__view-selected{
    display: none;
  }
  &_mode-choose-open &__view-search{
    display: block;
  }
  &_mode-choose-open &__options{
    display: block;
  }

  &__our{
    color: #fff;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    margin: 10px 0 15px 0;

    & > span{
      color: #000;
      cursor: pointer;
    }

    div{
      padding-top: 3px;

      span{
        color: #000;
        cursor: pointer;
      }
    }
  }

  //&__our + &__our{
  //  margin-bottom: 25px;
  //}

  &__our + .toggle{
    margin-top: 25px
  }
}
</style>