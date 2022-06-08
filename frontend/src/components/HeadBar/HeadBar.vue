<template>
  <div class="headbar">
    <nav class="headbar__nav">
      <router-link :to="{ name: 'ChooseNFT' }">
        <img src="@/assets/logo.jpg">
      </router-link>
    </nav>
    <div class="headbar__acc">
      <div class="headbar__acc-info">
        <span>Balance:</span> <b>{{ accBalance }}</b>
        <icon name="near" :size="20" class="near-icon" />
      </div>
      <a
        class="link"
        target="_blank"
        :href="`https://explorer.testnet.near.org/accounts/${getAccountId}`"
      >{{getAccountId}}</a>
      <button class="main-btn main-btn--exit" @click="logout">Sign out</button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { logout } from "@/nearConfig"

export default {
  name: "HeadBar",

  data() {
    return {
      activeHeaderContract: null,
    }
  },
  computed: {
    ...mapGetters([
      'getAccountId',
      'getCurrentWalletBalance',
      'getCurrentWallet',
      'getNearAccount',
    ]),
    accBalance() {
      return Number(this.getCurrentWalletBalance).toFixed(2)
    },
  },

  methods: {
    logout() {
      // deleting full access key
      // or later it will break logic
      if (sessionStorage.getItem('near_access_key')) {
        const key = sessionStorage.getItem('near_access_key')
        this.getNearAccount.deleteKey(key)
        sessionStorage.removeItem('near_access_key')
      }
      logout(this.getCurrentWallet)
    },
  },
}
</script>

<style lang="scss">
.headbar__acc {
  display: flex;
  align-items: center;
}

.headbar__acc-info {
  display: flex;
  align-items: center;
  color: #fff;
  margin-right: 20px;

  span {
    margin-right: 5px;
  }
}

.near-icon {
  margin-left: 5px;
}

.headbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  padding: 0 15px;
  background: #2d0949;
}

.headbar__nav {
  width: 60%;
  margin-right: auto;
}

.headbar__nav a.router-link-exact-active {
  text-decoration: underline;
}

.headbar__nav a.router-link-exact-active:before,
.headbar__nav a.router-link-exact-active:after {
  transform: scale(1);
}
</style>