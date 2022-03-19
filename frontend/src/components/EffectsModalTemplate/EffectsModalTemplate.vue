<template>
  <div class="modal-template">
    <div class="modal-template__body">
      <h3>Choose Effect</h3>

      <div
        class="modal-template__body-close"
        @click="closeModal"
      >
        <icon name="cross" :size="32" class="cross-icon" />
      </div>

      <div class="effect-confirm__inner">
        <h3>NFT effects</h3>

        <div
          class="effect-cards-box"
          v-if="getEffects && getEffects.length"
        >
          <effect-cards
            @cardClicked="chooseEffect"
            :show-id="false"
            :cards="getEffects"
            :choice="[getEffectChoice]"
            content-type="video"
          ></effect-cards>
          <button
            class="main-btn"
            @click="submitEffect"
          >Submit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import EffectCards from "@/components/EffectCards/EffectCards.vue"

export default {
  name: "EffectsModalTemplate",

  components: {
    EffectCards,
  },

  computed: {
    ...mapGetters([
      'getEffects',
      'getEffectChoice',
      'getDeployedPictureMeta',
    ]),
  },

  methods: {
    ...mapActions([
      'setEffectModal',
      'setEffectChoice',
      'setStyleResult',
      'setDeployedPictureMeta',
    ]),
    closeModal() {
      this.setEffectModal(false)
    },
    async chooseEffect(id) {
      if (this.getEffectChoice && id === this.getEffectChoice) {
        this.setEffectChoice(null)
      } else {
        this.setEffectChoice(id)
      }
    },
    async submitEffect() {
      await this.setStyleResult('base64')
      await this.setDeployedPictureMeta('base64')
      this.setEffectModal(false)
      console.log(this.getDeployedPictureMeta, 'getDeployedPictureMeta')
    }
  },
}

</script>

<style lang="scss" scope>
.modal-template {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  background: #ffffffbf;
  z-index: 100;
}

.modal-template__body-close {
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;


  &:hover {
    color: red;
    fill: red;
  }
}

.modal-template__body {
  position: relative;
  background: #fff;
  width: 85vw;
  height: 85vh;
  padding: 20px;
  border-radius: 4px;
  overflow-y: auto;
  border: 1px solid #2d0949;
  
  .effect-confirm__inner {
    margin-left: 0;

    h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  }
}
</style>