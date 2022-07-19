<template>
  <div
    :class="['modal-template',
             {
               small: small,
               disabled: isBlocked
             }]"
  >
    <div
      @click="closeModal"
      class="modal-template_bg"
    ></div>
    <div class="modal-template__body">
      
      <slot name="header"/>

      <div
        class="modal-template__body-close"
        v-if="!isBlocked"
        @click="closeModal"
      >
        <icon name="cross" :size="32" class="cross-icon" />
      </div>

      <div class="modal-template__body__content">
        <slot name="content"/>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: "ModalTemplate",

  props: {
    tokenMeta: Object,
    isBlocked: Boolean,
    small: Boolean,
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

.modal-template.disabled {
  cursor: default;
}

.modal-template__body__content {
  height: 90%;
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
  transition: background-color .3s linear;
  cursor: pointer;

  .modal-template.disabled & {
    pointer-events: none;
    cursor: default;
  }

  &:hover {
    background-color: #fcf7ff6b;
  }
}

.modal-template__body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #fcf7ff;
  width: 70vw;
  height: 70vh;
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