import Vue from "vue"
import App from "./App.vue"
import store from './store'
import router from './router'
import Notifications from 'vue-notification'
import IconComponent from './components/Icon'

import { initContract } from "./nearConfig"
// import { initContract2 } from "./nearConfig2"

Vue.config.productionTip = false
Vue.use(Notifications)
Vue.component('Icon', IconComponent)

// initContract2(store)
initContract(store)
  .then(() => {
    const user = store.getters.getCurrentWallet.isSignedIn()
    if (!user) {
      router.push('/login')
    }
    store.dispatch('setContractLoading', false)
  })
  
new Vue({
  store,
  router,
  render: h => h(App),
}).$mount("#app")