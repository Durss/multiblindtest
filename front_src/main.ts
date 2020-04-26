import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './less/index.less';
import StatsManager from './utils/StatsManager';
import { Route } from 'vue-router';
import SpotifyAPI from './utils/SpotifyAPI';
import Config from './utils/Config';
import VueI18n from 'vue-i18n';
import AnswerTester from './utils/AnswerTester';
import SockController, { SOCK_ACTIONS } from './sock/SockController';

Vue.config.productionTip = false;
Config.init();
Vue.use(VueI18n);
let userLang: string = navigator.language || (<any>navigator)['userLanguage'];
userLang = userLang.substr(0, 2).toLowerCase();
store.dispatch("setLanguageCode", userLang);

if(!Config.IS_PROD) {
	AnswerTester.instance.run();
}

// console.log(userLang);
const i18n = new VueI18n({
	locale: userLang,
	fallbackLocale: 'en',
	silentTranslationWarn:true,
});

//Cleanup local storage if not at the proper version number
if(localStorage.getItem("v") != Config.STORAGE_VERSION.toString()) {
	localStorage.clear();
	localStorage.setItem("v", Config.STORAGE_VERSION.toString());
}

router.beforeEach(async (to:Route, from:Route, next:Function) => {
	//If first route, wait for data to be loaded
	if (!store.state.initComplete) {
		store.dispatch("startApp", { route: to, i18n:i18n }).then(_ => {
			//If user tries to access a page that needs to be authenticated via Spotify,
			//redirect her/him to the homepage
			if(!store.state.loggedin && to.matched[0].meta.needAuth === true) {
				router.push({name:"home", params:{from:document.location.href}});
			}else{
				//otherwise...keep going !
				nextStep(next, to);
			}
		});
	}else{
		//If needs spotify auth to access this page, check if a valid token is
		//loaded. If not, the user will be redirected to oAuth process.
		if(to.matched[0].meta.needAuth === true) {
			await SpotifyAPI.instance.refreshTokenIfNecessary(to);
		}
		nextStep(next, to);
	}
});

let disconnectTimeout = null;
function nextStep(next:Function, to:Route):void {
	let meta = to.matched? to.matched[0].meta : null;
	if(meta && meta.tag) {
		StatsManager.instance.pageView(meta.tag.path, meta.tag.title);
	}

	if(to.matched[0].meta.needGroupAuth == true){
		if(disconnectTimeout) {
			disconnectTimeout = null;
			clearTimeout(disconnectTimeout);
		}
		if(!SockController.instance.connected) {
			SockController.instance.connect();
		}
	}else{
		if(SockController.instance.connected) {
			//If user leaves multiplayer game, tell the server s·he left the room
			let u = store.state.userGroupData;
			SockController.instance.sendMessage({action:SOCK_ACTIONS.LEAVE_ROOM, data:u});
			disconnectTimeout = setTimeout(_=> {
				//Cut socket connexion
				SockController.instance.disconnect();
			}, 250);
		}
	}
	next();
}

Vue.directive('focus', {
    inserted: function (el) {
        el.focus()
    }
})


new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
