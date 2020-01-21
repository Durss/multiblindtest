import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './less/index.less';

Vue.config.productionTip = false;

router.beforeEach((to, from, next) => {
	//If first route, wait for data to be loaded
	if (!store.state.initComplete) {
		store.dispatch("startApp", { route: to }).then(_ => {
			if(!store.state.loggedin && to.matched[0].meta.needAuth === true) {
				router.push({name:"home", params:{from:document.location.href}});
			}else{
				next();
			}
		});
	}else{
		next();
	}
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
