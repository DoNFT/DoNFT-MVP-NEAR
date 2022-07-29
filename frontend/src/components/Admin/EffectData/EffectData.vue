<template>
  <div class="admin-effects-contract" :class="{active: isDetailsOpen}">
    <div class="admin-effects-contract__address" @click="isDetailsOpen = !isDetailsOpen">
      <div class="admin-effects-contract__name" v-text="contract.original_contract"></div>
      <a
        target="_blank"
        :href="`https://explorer.testnet.near.org/accounts/${contract.original_contract}`"
        class="admin-effects-contract__link"
      >
        <svg width="24" viewBox="0 0 30 30"><path d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"></path></svg>
      </a>
      <div class="admin-effects-contract__toggle" @click="isDetailsOpen = !isDetailsOpen">
        <svg viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
      </div>
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


<style lang="scss" scoped>
.admin-effects-contract__name {
  display: inline-block;
}

.admin-effects-contract__link {
  width: 24px;

  &:hover svg {
    fill: #5ce9bc;
  }
}
</style>