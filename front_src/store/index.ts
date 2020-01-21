import Vue from 'vue';
import Vuex from 'vuex';
import SpotifyAPI from '@/utils/SpotifyAPI';

Vue.use(Vuex)

let startPromise: Promise<any>;

export default new Vuex.Store({
	state: {
		initComplete: false,
		loggedin:false,
		tooltip: null,
		alert: null,
		accessToken:null,
		playlistsCache:null,
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
				localStorage.setItem("accessToken", payload.access_token);
			} else {
				localStorage.removeItem("accessToken");
			}
		},

		initComplete(state) { state.initComplete = true; },

		openTooltip(state, payload) { state.tooltip = payload; },
		
		closeTooltip(state) { state.tooltip = null; },

		confirm(state, payload) { state.confirm = payload; },

		playlistsCache(state, payload) {
			state.playlistsCache = payload;
			try {
				localStorage.setItem("playlistsCache", JSON.stringify(payload));
				localStorage.setItem("playlistsCache2", JSON.stringify(payload));
			}catch(error) {
				state.alert = "Maximum cache space reached, cannot cache your playlists sorry :("
			}
		},
		
	},






	actions: {
		async startApp({ commit, state, dispatch }, payload) {
			//Security to make sure startApp isn't executed twice if changing URL while loading
			if (startPromise && payload.force !== true) return startPromise;
			
			state.initComplete = false;
			let token = localStorage.getItem("accessToken");
			if(token) {
				state.loggedin = true;
				state.accessToken = token;
				SpotifyAPI.instance.setToken(token);
				state.playlistsCache = JSON.parse( localStorage.getItem("playlistsCache") );
			}

			startPromise = new Promise(async (resolve, reject) => {
				commit("initComplete", true);
				resolve();
			});

			return startPromise;
		},

		openTooltip({commit}, payload) { commit("openTooltip", payload); },
		
		closeTooltip({commit}) { commit("closeTooltip", null); },

		confirm({commit}, payload) { commit("confirm", payload); },

		authenticate({commit}, payload) { commit("authenticate", payload); },

		playlistsCache({commit}, payload) { commit("playlistsCache", payload); },
	}
})
