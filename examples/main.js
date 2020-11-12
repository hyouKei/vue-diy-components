import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import ElementUI from 'element-ui'
import './element-variables.scss'

import DiyCompt from '../packages'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(DiyCompt)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
