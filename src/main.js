import Vue from "vue"
import App from "./App.vue"
import store from './store'
import router from './router'
import Notifications from 'vue-notification'

import { initContract } from "./utils"

Vue.config.productionTip = false
Vue.use(Notifications)

window.nearInitPromise = initContract()
  .then(() => {
    new Vue({
      router,
      store,
      render: h => h(App),
    }).$mount("#app")

  })
  