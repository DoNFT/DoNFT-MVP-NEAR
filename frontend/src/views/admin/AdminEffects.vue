<template>
  <div class="page">
    <nav-bar
      :navigation="getNavigation"
    />
    <div class="page__content">
      <h1>Effects panel</h1>
      <effect-data
        v-for="contract in contractsAdded"
        :key="contract.original_contract"
        :contract="contract"
        @remove="removeContract"
      />
      <button
        class="main-btn main-btn--deploy"
        @click="showAddingModal = true"
      >Add effect contract</button>
    </div>
    <modal-template
      v-if="showAddingModal"
      small
      @close="showAddingModal = false"
    >
      <template #header>
        <h2>Add contract</h2>
      </template>
      <template #content>
        <div
          class="editor-send-modal"
        >
          <form
            class="form-nft"
          >
            <div class="form-ntf__inputs">
              <span class="form-nft-send__inputs-title required">Contract address</span>
              <input
                type="text"
                placeholder="address"
                class="input form-nft__input"
                v-model="contractData.original_contract"
              >
              <span class="form-nft-send__inputs-title required">Contract type</span>
              <select
                class="input form-nft__input"
                v-model="contractData.collection_type"
              >
                <option :value="null">--Choose a contract type--</option>
                <option value="colors">COLORS</option>
                <option value="things">THINGS</option>
                <option value="characters">CHARACTERS</option>
                <option value="achievements">ACHIEVEMENTS</option>
              </select>

              <span class="form-nft-send__inputs-title required">Effects server url</span>
              <input
                type="text"
                placeholder="url"
                class="input form-nft__input"
                v-model="contractData.server_url"
              >
              <span class="form-nft-send__inputs-title required">Contract owner</span>
              <input
                type="text"
                placeholder="owner"
                class="input form-nft__input"
                v-model="contractData.owner_id"
              >
              <span class="form-nft-send__inputs-title">Can apply only for</span>
              <input
                type="text"
                placeholder="apply for"
                class="input form-nft__input"
                v-model="contractData.modificators_contract"
              >
              <button
                class="main-btn"
                @click.prevent="addNewContract"
              >Submit</button>
            </div>
          </form>
        </div>

      </template>
    </modal-template>

  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex"
import NavBar from '@/components/NavBar/NavBar'
import ModalTemplate from '@/components/ModalTemplate/ModalTemplate'
import EffectData from '@/components/Admin/EffectData/EffectData'

export default {
  name: "AdminEffects",

  components: {
    NavBar,
    ModalTemplate,
    EffectData
  },

  data() {
    return {
      showAddingModal: false,
      contractsAdded: [],
      contractData: {
        server_url: null,
        owner_id: null,
        original_contract: null,
        modificators_contract: null,
        collection_type: null,
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
      'getEffectsListContract',
    ]),
  },

  mounted() {
    this.fetchContracts()
  },

  methods: {
    ...mapActions([
      'addEffectToList',
      'removeFromList'
    ]),
    removeContract(id) {
      this.removeFromList(id)
    },
    addNewContract() {
      console.log('add')
      this.addEffectToList(this.contractData)
    },
    async fetchContracts() {
      console.log('add')
      await this.getEffectsListContract
        .get_effects_list()
        .then((res) => this.contractsAdded = res)
    },
  },
}
</script>

<style lang="scss">
.admin-effects{
  min-height: 100px;

  &__list{
    padding: 30px 0;
  }

  &__search{
    width: 100%;
    max-width: 450px;
    padding: 20px 0 0 0;
  }
}

.admin-effects-contract{
  position: relative;

  & + &{
    margin-top: 20px
  }

  &__name{
    color: #000;
    font-weight: 600;
    font-size: 24px;
    line-height: 30px;
    padding-right: 15px;
    transition: color .2s ease;
  }

  &__toggle{
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    transition: .2s;

    svg{
      width: 24px;

      path{
        fill: #000;
      }
    }
  }

  &__address{
    text-align: left;
    cursor: pointer;

    a{
      color: #000;
      font-size: 18px;
      line-height: 28px;
      word-break: break-all;
      display: inline;

    }
  }

  &__props{
    display: none;
    grid-template-columns: 140px auto;
    padding: 20px 0;
    gap: 10px;
    word-break: break-all;


    & > div{
      color: #000;
      font-size: 18px;
      line-height: 28px;

      &:nth-child(odd){
        font-weight: 500;
        color: #f96b8a;
      }
    }
  }

  &.active &__props{
    display: grid;
  }

  &.active &__toggle{
    transform: rotate(180deg);
  }

  &__actions{
    display: none;
  }

  &__actions{
    display: none;
  }

  &.active &__actions{
    display: block;
  }
}

.page__content {
  width: 75%;
}
</style>