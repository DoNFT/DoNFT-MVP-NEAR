<template>
  <div class="admin-effects-contract" :class="{active: isDetailsOpen}">
    <div class="admin-effects-contract__name" v-text="'contract'" @click="isDetailsOpen = !isDetailsOpen"></div>
    <div class="admin-effects-contract__toggle" @click="isDetailsOpen = !isDetailsOpen">
      <svg viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
    </div>
    <div class="admin-effects-contract__address">
      <a
        href="#"
      >
        {{ contract.contractAddress }}
      </a>
    </div>
    <div class="admin-effects-contract__props">
      <div v-text="'Server url'"></div>
      <div v-text="contract.server_url"></div>
      <div v-text="'Owner id'"></div>
      <div v-text="contract.owner_id"></div>
      <div v-text="'Can apply for'"></div>
      <div v-text="contract.modificators_contract || 'For any'"></div>
      <div v-text="'Total supply'"></div>
      <!-- <div v-text="contract.meta.totalSupply"></div> -->
    </div>
    <div class="admin-effects-contract__actions">
      <span
        class="main-btn main-btn--exit"
        v-text="'remove'"
        @click="remove"
      ></span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdminEffectsData",

  props: {
    contract: Object,
  },

  data() {
    return {
      isDetailsOpen: false,
    }
  },
  methods: {
    remove() {
      console.log('remove')
      this.$emit('remove', this.contract.original_contract)
    },
  },
}
</script>