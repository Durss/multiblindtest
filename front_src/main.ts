import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import {initRouter} from './router'
import { useStoreMain } from './store'
import { i18n } from './i18n';
import './less/index.less';
import type { RouteLocationNormalized } from 'vue-router';
import SpotifyAPI from './utils/SpotifyAPI';
import Config from './utils/Config';
import AnswerTester from './utils/AnswerTester';
import SockController, { SOCK_ACTIONS } from './sock/SockController';
import gsap from "gsap";
import { ScrollToPlugin } from 'gsap/all';
import Utils from './utils/Utils';
import TwitchExtensionHelper from './twitch/TwitchExtensionHelper';
import Store from './store/Store';
import { Buffer } from 'buffer';
import process from 'process';

globalThis.Buffer = Buffer;
globalThis.process = process;

const app = createApp(App);
app.use(createPinia());
const storeMain = useStoreMain();

Config.init();
let routerMode:"history"|"hash" = "history";
let userLang: string = navigator.language || (<any>navigator)['userLanguage'];
userLang = userLang.substr(0, 2).toLowerCase();
storeMain.setLanguageCode(userLang);
gsap.registerPlugin(ScrollToPlugin);

if(!Config.IS_PROD) {
	AnswerTester.instance.run();
}

//Cleanup local storage if not at the proper version number
if(localStorage.getItem("v") != Config.STORAGE_VERSION.toString()) {
	localStorage.clear();
	localStorage.setItem("v", Config.STORAGE_VERSION.toString());
}

if(Utils.getQueryParameterByName('anchor') == "video_overlay"
|| document.location.href.indexOf("twitchextension") > -1
|| document.location.href.indexOf("twitch/config") > -1) {
	// router.push({name:'twitchext'});
	storeMain.hideBackground = true;
	TwitchExtensionHelper.instance.initialize();
	routerMode = "hash";
}

let router = initRouter(routerMode);

router.beforeEach(async (to:RouteLocationNormalized) => {
	//If first route, wait for data to be loaded
	if (!storeMain.initComplete) {
		await storeMain.startApp({ route: to });
		//If user tries to access a page that needs to be authenticated via Spotify,
		//redirect her/him to the homepage
		if(!storeMain.loggedin && Utils.getRouteMetaValue(to, "needAuth") === true) {
			//Home page will redirect here after authentication
			Store.set("redirect", document.location.href);
			return {name:"home"};
		}
	}else{
		//If needs spotify auth to access this page, check if a valid token is
		//loaded. If not, the user will be redirected to oAuth process.
		if(Utils.getRouteMetaValue(to, "needAuth") === true) {
			try {
				await SpotifyAPI.instance.refreshTokenIfNecessary(to);
			}catch(error) {
				if(!SpotifyAPI.instance.hasAccessToken) {
					await storeMain.authenticate({});
					//Home page will redirect here after authentication
					Store.set("redirect", document.location.href);
					return {name:"home"};
				}
				return false;
			}
		}
	}
	//otherwise...keep going !
	nextStep(to);
});

let disconnectTimeout = null;
function nextStep(to:RouteLocationNormalized):void {
	let needsTwitchHelper = Utils.getRouteMetaValue(to, "needsTwitchHelper");
	if(needsTwitchHelper) {
		TwitchExtensionHelper.instance.initialize();
	}

	if(Utils.getRouteMetaValue(to, "needGroupAuth") == true){
		if(disconnectTimeout) {
			disconnectTimeout = null;
			clearTimeout(disconnectTimeout);
		}
		if(!SockController.instance.connected) {
			SockController.instance.connect();
		}
	}else  if(Utils.getRouteMetaValue(to, "needSocket") !== true){
		if(SockController.instance.connected) {
			//If user leaves multiplayer game, tell the server s·he left the room
			let u = storeMain.userGroupData;
			let g = storeMain.groupRoomData;
			if(g) {
				SockController.instance.sendMessage({action:SOCK_ACTIONS.LEAVE_ROOM, data:{user:u, groupId:g.id}});
			}
			disconnectTimeout = setTimeout(_=> {
				//Cut socket connexion
				SockController.instance.disconnect();
			}, 250);
		}
	}
}

app.directive('focus', {
	mounted: function (el) {
		el.focus()
	}
})

app.use(router);
app.use(i18n);
app.mount('#app');
