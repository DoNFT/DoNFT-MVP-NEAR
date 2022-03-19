<template>
  <div class="home-text">
    <div class="home-text__inner">
      <h1>Welcome to DoNFT demo on Near</h1>
      <p class="home-text__inner__subtext">Use power of neural network algorithms to create new unique combinations of digital art</p>
      <p class="home-text__inner__subtext">Go ahead and click the button below to try it out:</p>
      <p style="text-align:center; margin-top:2.5em">
        <button class="main-btn" @click="login">Sign in</button>
      </p>
    </div>
    <img src="@/assets/home_img.jpg" style="height: 30%;  border-radius:20%;" >
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import { login } from "@/nearConfig"

export default {
  name: "Login",

  computed: {
    ...mapGetters([
      'getCurrentWallet',
    ]),
  },

  mounted() {
    if (this.getCurrentWallet) {
      this.$router.push({name: 'ChooseNFT'})
    }
  },

  methods: {
    login() {
      login(this.getCurrentWallet)
    },
  },
}
</script>

<style scoped>
.home-text {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  min-height: 60vh;
}

.home-text__inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 50%;
}

.home-text img {
  width: 30%;
  margin-left: 20px;
}
</style>