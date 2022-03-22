import Vue from "vue"
import App from "@/App.vue"
import store from '@/store'
import router from '@/router'
import Notifications from 'vue-notification'
import IconComponent from '@/components/Icon'


Vue.config.productionTip = false
Vue.use(Notifications)
Vue.component('Icon', IconComponent)
  
new Vue({
  store,
  router,
  render: h => h(App),
}).$mount("#app")