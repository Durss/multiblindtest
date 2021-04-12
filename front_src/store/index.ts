import Vue from 'vue';
import Vuex from 'vuex';
import SpotifyAPI from '@/utils/SpotifyAPI';
import StatsManager from '@/utils/StatsManager';
import SockController from '@/sock/SockController';
import Labels from '@/i18n/Label';
import RoomData from '@/vo/RoomData';
import Store from './Store';

Vue.use(Vuex)

let startPromise: Promise<any>;

export default new Vuex.Store({
	state: {
		initComplete: false,
		loggedin:false,
		tooltip: null,
		alert: null,
		lang: null,
		i18n: null,
		volume: .5,
		needUserInteraction:false,
		accessToken:null,
		playlistsCache:null,
		userGroupData:null,
		groupRoomData:null,//This is only used to transmit data from lobby to game view
		
		twitchLogin:null,
		twitchOAuthToken:null,
		twitchAllowedUsers:null,
		twitchPlaylists:null,
		twitchExpertMode:false,
		twitchGameState:null,
		twitchLeaderboard:null,
		twitchJoin:null,
		hideBackground:null,//for OBS

		confirm:{
			title:null,
			description:null,
			confirmCallback:null,
			cancelCallback:null,
		},
	},






	mutations: {
		authenticate(state, payload) {
			state.loggedin = true;
			if (payload.access_token) {
				state.accessToken = payload.access_token;
				let expirationDate:number = new Date().getTime() + parseInt(payload.expires_in) * 1000;
				Store.set("accessToken", payload.access_token);
				Store.set("expirationDate", expirationDate.toString());
				SpotifyAPI.instance.setToken(payload.access_token);
			} else {
				Store.remove("accessToken");
				Store.remove("expirationDate");
			}
		},

		initComplete(state) { state.initComplete = true; },

		openTooltip(state, payload) { state.tooltip = payload; },
		
		closeTooltip(state) { state.tooltip = null; },

		confirm(state, payload) { state.confirm = payload; },

		playlistsCache(state, payload) {
			state.playlistsCache = payload;
			try {
				Store.set("playlistsCache", JSON.stringify(payload));
			}catch(error) {
				state.alert = "Maximum cache space reached, cannot cache your playlists sorry :("
			}
		},

		alert(state, payload) { state.alert = payload; },

		setUserGroupData(state, payload) { 
			state.userGroupData = payload;
			SockController.instance.user = payload;
			Store.set("userGroupData", JSON.stringify(payload));
		},

		setGroupRoomData(state, payload) { state.groupRoomData = payload; },

		setLanguageCode(state, payload) {
			state.lang = payload;
			// moment.locale(payload);
			if(state.i18n){
				state.i18n.locale = payload;
			}
		},

		setVolume(state, payload) {
			state.volume = payload;
			Store.set("volume", payload.toString())
		},

		setNeedUserInteraction(state, payload) { state.needUserInteraction = payload; },

		setUserName(state, payload) {
			state.userGroupData.name = payload;
			Store.set("userGroupData", JSON.stringify(state.userGroupData));
		},

		setTwitchOAuthToken(state, payload) {
			state.twitchOAuthToken = payload;
			Store.set("twitchOAuthToken", state.twitchOAuthToken);
		},

		setTwitchLogin(state, payload) {
			state.twitchLogin = payload;
			Store.set("twitchLogin", state.twitchLogin);
		},

		setTwitchAllowedUsers(state, payload) {
			state.twitchAllowedUsers = payload;
			Store.set("twitchAllowedUsers", JSON.stringify(state.twitchAllowedUsers));
		},

		setHideBackground(state, payload) { state.hideBackground = payload; },

		setTwitchPlaylists(state, payload) { state.twitchPlaylists = payload; },

		setTwitchExpertMode(state, payload) { state.twitchExpertMode = payload; },

		setTwitchGameState(state, payload) { state.twitchGameState = payload; },

		setTwitchLeaderboard(state, payload) { state.twitchLeaderboard = payload; },

		setTwitchJoin(state, payload) { state.twitchJoin = payload; },

	},






	actions: {
		async startApp({ commit, state, dispatch }, payload) {
			//Security to make sure startApp isn't executed twice if changing URL while loading
			if (startPromise && payload.force !== true) return startPromise;
			
			state.initComplete = false;
			let token = Store.get("accessToken");
			if(token) {
				state.loggedin = true;
				state.accessToken = token;
				SpotifyAPI.instance.setToken(token);
				state.playlistsCache = JSON.parse( Store.get("playlistsCache") );
				if(payload.route.meta.needAuth && !SpotifyAPI.instance.isTokenExpired()) {
					let me = await SpotifyAPI.instance.call("v1/me");
					if(me && me.id) {
						StatsManager.instance.clientId = me.id;
					}
				}
			}

			if(payload.i18n) {
				//Load labels and init i18n
				// let labels = await Api.get("public/labels");
				state.i18n = payload.i18n;
				dispatch("setLabels", Labels.json)
			}
			
			let twitchToken = Store.get("twitchOAuthToken");
			if(twitchToken) state.twitchOAuthToken = twitchToken;
			let twitchLogin = Store.get("twitchLogin");
			if(twitchLogin) state.twitchLogin = twitchLogin;
			let twitchAllowedUsers = Store.get("twitchAllowedUsers");
			if(twitchAllowedUsers) state.twitchAllowedUsers = JSON.parse(twitchAllowedUsers);

			let volume = Store.get("volume");
			if(volume != null) {
				state.volume = parseFloat(volume);
			}else{
				state.volume = .5;
			}
			
			let user = Store.get("userGroupData");
			if(user) {
				//load last group user from storage
				commit("setUserGroupData", JSON.parse(user));
			}

			startPromise = new Promise(async (resolve, reject) => {
				commit("initComplete", true);
				resolve(null);
			});

			return startPromise;
		},

		setLabels({state}, payload) {
			for (const lang in payload) {
				state.i18n.setLocaleMessage(lang, payload[lang]);
			}
		},

		openTooltip({commit}, payload) { commit("openTooltip", payload); },
		
		closeTooltip({commit}) { commit("closeTooltip", null); },

		confirm({commit}, payload) { commit("confirm", payload); },

		authenticate({commit}, payload) { commit("authenticate", payload); },

		playlistsCache({commit}, payload) { commit("playlistsCache", payload); },

		alert({commit}, payload) { commit("alert", payload); },

		setUserGroupData({commit}, payload) { commit("setUserGroupData", payload); },
		
		setGroupRoomData({commit}, payload) { commit("setGroupRoomData", payload); },

		setLanguageCode({commit}, payload) { commit("setLanguageCode", payload); },

		setVolume({commit}, payload) { commit("setVolume", payload); },

		setNeedUserInteraction({commit}, payload) { commit("setNeedUserInteraction", payload); },

		setUserName({commit}, payload) { commit("setUserName", payload); },

		setTwitchOAuthToken({commit}, payload) { commit("setTwitchOAuthToken", payload); },

		setTwitchLogin({commit}, payload) { commit("setTwitchLogin", payload); },

		setTwitchAllowedUsers({commit}, payload) { commit("setTwitchAllowedUsers", payload); },

		setHideBackground({commit}, payload) { commit("setHideBackground", payload); },

		setTwitchPlaylists({commit}, payload) { commit("setTwitchPlaylists", payload); },

		setTwitchExpertMode({commit}, payload) { commit("setTwitchExpertMode", payload); },

		setTwitchGameState({commit}, payload) { commit("setTwitchGameState", payload); },

		setTwitchLeaderboard({commit}, payload) { commit("setTwitchLeaderboard", payload); },

		setTwitchJoin({commit}, payload) { commit("setTwitchJoin", payload); },
	}
})
