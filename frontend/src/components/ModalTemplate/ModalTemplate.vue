<template>
  <div :class="['modal-template', { small: small }]">
    <div
      @click="closeModal"
      class="modal-template_bg"
    ></div>
    <div class="modal-template__body">
      
      <slot name="header"/>

      <div
        class="modal-template__body-close"
        @click="closeModal"
      >
        <icon name="cross" :size="32" class="cross-icon" />
      </div>


      <slot name="content"/>

      <div
        class="effect-confirm__inner"
        v-if="tokenMeta"
      >
        <h4>Picture could not appear at first, approximately 1-3 minutes for upload</h4>

        <div
          class="effect-cards-box"
          
        >
          <token-card
            :metadata="tokenMeta"
          />
          <button
            class="main-btn"
            @click="submitResult"
          >Submit Image</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TokenCard from "@/components/TokenCard/TokenCard.vue"

export default {
  name: "ModalTemplate",

  props: {
    tokenMeta: Object,
    small: Boolean,
  },

  components: {
    TokenCard,
  },


  methods: {
    closeModal() {
      this.$emit('close', false)
    },
    async submitResult() {
      this.$emit('submit', true)
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

.modal-template_bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
  transition: background-color .1s ease;
  cursor: pointer;

  &:hover {
    background-color: #ffffffab;
  }
}

.modal-template__body {
  position: relative;
  background-color: #fcf7ff;
  width: 70vw;
  height: 55vh;
  padding: 20px;
  border-radius: 4px;
  overflow-y: auto;
  border: 1px solid #2d0949;
  z-index: 2;

  .small & {
    width: auto;
    height: auto;
    max-width: 50vw;
    max-height: 50vh;
  }
  
  .effect-confirm__inner {
    margin-left: 0;

    h4 {
      margin: 20px 0;
      background: #2d0949;
      padding: 12px;
      border-radius: 4px;
      color: #fff;
    }

    h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  }
}
</style>