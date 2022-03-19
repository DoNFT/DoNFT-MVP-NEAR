<template>
  <svg
    v-if="icon"
    :key="name"
    :class="$options.name"
    :name="name"
    :style="style"
    :viewBox="icon.viewBox"
    @click="$emit('click')"
  >
    <title v-if="title">{{ title }}</title>
    <use :xlink:href="`#${icon.id}`" />
  </svg>
</template>

<script>
import ICONS from './icons'

export default {
  name: 'icon',
  inheritAttrs: false,
  props: {
    title: {
      type: String,
      default: () => '',
    },
    size: Number,
    color: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
      validator: (value) => value in ICONS,
    },
    stroke: Boolean,
  },
  computed: {
    style() {
      const style = []

      if (this.size) {
        style.push(`width: ${this.size}px`)
        style.push(`height: ${this.size}px`)
      }

      if (this.color) {
        style.push(`color: ${this.color}`)
      }

      if (this.stroke) {
        style.push('stroke: currentColor')
      }

      return style.join(';')
    },
    icon() {
      return ICONS[this.name]
    },
  },
}
</script>

<style lang="scss" scoped>
$default-size: 12px;

.icon {
  width: $default-size;
  height: $default-size;
  min-width: $default-size;

  display: inline-block;
  fill: currentColor;
  box-sizing: border-box;
}
</style>
