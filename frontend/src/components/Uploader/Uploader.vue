<template>
  <label :for="id" :class="['upload-region-component', { 'drag-over': dragOver }]">
    <div
      class="drag-n-drop-zone"
      @dragenter.prevent.stop="dragOver = true"
      @dragover.prevent.stop="dragOver = true"
      @dragleave.prevent.stop="dragOver = false"
      @dragexit.prevent.stop="dragOver = false"
      @drop.prevent.stop="onFileSelected"
    />

    <div
      class="upload-region-component__info"
      v-if="!imgSource"
    >
      <icon name="upload" :size="48" class="upload-icon" />

      <div class="upload-region-component__text">
        <span>Drop or Click</span> <br>
      </div>
    </div>

    <img
      class="upload-region-component__img"
      :src="imageSrc || imgSource"
    >

    <input
      :id="id"
      ref="inputFile"
      type="file"
      @change="onFileSelected"
    />
  </label>
</template>

<script>
import { mapActions } from "vuex"
export default {
  name: 'upload-region-component',
  props: {
    withEffects: Boolean,
    imageSrc: String,
  },
  data() {
    return {
      dragOver: false,
      id: `id-${Date.now()}`,
      imgSource: null,
    }
  },
  methods: {
    ...mapActions([
      'setEffectModal',
      'setDroppedImage',
      'getIPFSimage',
    ]),
    onFileSelected(event) {
      this.dragOver = false
      const img = event.target.files ? event.target.files[0] : null
      this.$refs.inputFile.value = null
      this.updateImage(img)

      if (this.withEffects) {
        this.setEffectModal(true)
      }
    },
    buttonClick() {
      document.getElementById(this.id).click()
    },
    updateImage(img) {
      const reader = new FileReader()

      reader.onload = (event) => {
        this.imgSource = event.target.result
        this.$emit('selected', this.imgSource)
        this.setDroppedImage(this.imgSource)
      }
      console.log(this.imgSource, 'this.imgSource')
      reader.readAsDataURL(img)
    }

  },
}
</script>

<style lang="scss" scoped>
.upload-region-component {
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 250px;
  width: 250px;
  background-color: #fff;
  border: 1px dashed gray;
  border-radius: 2px;
  cursor: pointer;
  padding: 0 28px;
  transition: border-color .3s, box-shadow .3s;

  &:hover {
    border-color: rgba(45, 9, 73, 1);
    box-shadow: 0 5px 8px rgba(0, 0, 0, .3);

    .upload-icon {
      background: rgba(0, 0, 0, .85);
      fill: #5ce9bc;
    }
  }

  &.drag-over {
    border-color: rgba(45, 9, 73, 1);
    box-shadow: 0 5px 8px rgba(45, 9, 73, .3);
  }

  .drag-n-drop-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }

  .button {
    width: 128px;
    z-index: 100;
  }

  &__info {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  &__text {
    font-size: 13px;
    line-height: 16px;
    font-weight: 400;

    & span {
      font-weight: 700;
      font-size: 14px;
      line-height: 22px;
    }
  }

  input[type="file"] {
    position: absolute;
    left: -100000000px;
  }
}

.upload-region-component__info {
  margin-top: 30px;
  width: 100%;
}

.upload-icon {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  fill: rgba(45, 9, 73, 1);
  transition: background .2s ease, fill .25s ease-in-out;
}

.upload-region-component__img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  left: 0;
  right: 0;
}
</style>
