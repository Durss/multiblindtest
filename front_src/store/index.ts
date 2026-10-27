import { i18n } from '@/i18n';
import Labels from '@/i18n/Label';
import SockController from '@/sock/SockController';
import TwitchUtils, { TwitchAuthToken } from '@/twitch/TwitchUtils';
import SpotifyAPI from '@/utils/SpotifyAPI';
import PlaylistData from '@/vo/PlaylistData';
import RoomData from '@/vo/RoomData';
import UserData from '@/vo/UserData';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import Store from './Store';

let startPromise: Promise<any>;

export interface ConfirmData {
	title:string;
	description?:string;
	confirmCallback?:()=>void;
	cancelCallback?:()=>void;
}

export const useStoreMain = defineStore("main", () => {
	const initComplete = ref<boolean>(false);
	const loggedin = ref<boolean>(false);
	const tooltip = ref<string>(null);
	const alert = ref<string>(null);
	const lang = ref<string>(null);
	const volume = ref<number>(.5);
	const needUserInteraction = ref<boolean>(false);
	const playlistsCache = ref<PlaylistData[]>(null);
	const userGroupData = ref<UserData>(null);
	const groupRoomData = ref<RoomData>(null);//This is only used to transmit data from lobby to game view

	const twitchLogin = ref<string>(null);
	const twitchOAuthToken = ref<TwitchAuthToken|null>(null);
	const twitchAllowedUsers = ref<any>(null);
	const twitchPlaylists = ref<{name:string, cover:string, id:string}[]>(null);
	const twitchExpertMode = ref<string[]>(null);
	const twitchGameState = ref<any>(null);
	const twitchLeaderboard = ref<any>(null);
	const twitchJoin = ref<any>(null);
	const hideBackground = ref<boolean>(null);//for OBS

	const confirm = ref<ConfirmData>({
		title:null,
		description:null,
		confirmCallback:null,
		cancelCallback:null,
	});



	async function startApp(payload:{route:RouteLocationNormalized, force?:boolean}):Promise<any> {
		//Security to make sure startApp isn't executed twice if changing URL while loading
		if (startPromise && payload.force !== true) return startPromise;

		initComplete.value = false;
		if(Store.get("spotify_access_token")) {
			loggedin.value = SpotifyAPI.instance.initFromStore();
			if(loggedin.value) {
				playlistsCache.value = JSON.parse( Store.get("playlistsCache") );
				if(payload.route.meta.needAuth) {
					try {
						if(SpotifyAPI.instance.isTokenExpired()) {
							await SpotifyAPI.instance.refreshToken();
						}
						await SpotifyAPI.instance.call("v1/me");
					}catch(error) {
						//Token is dead and couldn't be renewed. SpotifyAPI already
						//started an OAuth process, unless it detected a loop in which
						//case it cleared the credentials.
						loggedin.value = SpotifyAPI.instance.hasAccessToken;
					}
				}
			}
		}

		//Load labels
		// let labels = await Api.get("public/labels");
		setLabels(Labels.json);

		let twitchToken = Store.get("twitchOAuthToken");
		try {
			if(twitchToken) twitchOAuthToken.value = JSON.parse(twitchToken);
			if(twitchOAuthToken.value.refresh_token) {
				await refreshTwitchToken();
			}
		}catch(error) {
			//Failed parsing token, probably an old one when i was only storing
			//an access token as a simple string instead of an full serialized
			//auth token object
		}
		let storedTwitchLogin = Store.get("twitchLogin");
		if(storedTwitchLogin) twitchLogin.value = storedTwitchLogin;
		let storedTwitchAllowedUsers = Store.get("twitchAllowedUsers");
		if(storedTwitchAllowedUsers) twitchAllowedUsers.value = JSON.parse(storedTwitchAllowedUsers);

		let storedVolume = Store.get("volume");
		if(storedVolume != null) {
			volume.value = parseFloat(storedVolume);
		}else{
			volume.value = .5;
		}

		let user = Store.get("userGroupData");
		if(user) {
			//load last group user from storage
			setUserGroupData(JSON.parse(user));
		}

		startPromise = new Promise(async (resolve, reject) => {
			initComplete.value = true;
			resolve(null);
		});

		return startPromise;
	}

	async function authenticate(payload:{code?:string}):Promise<boolean> {
		console.log("auth....")
		if (payload.code) {
			loggedin.value = await SpotifyAPI.instance.getToken(payload.code);
			console.log("lOaded")
			return loggedin.value;
		} else {
			loggedin.value = false;
			Store.remove("spotify_access_token");
			Store.remove("expirationDate");
		}
		return false;
	}

	function setLabels(payload:any):void {
		for (const locale in payload) {
			i18n.global.setLocaleMessage(locale, payload[locale]);
		}
	}

	function setPlaylistsCache(payload:PlaylistData[]):void {
		playlistsCache.value = payload;
		try {
			Store.set("playlistsCache", JSON.stringify(payload));
		}catch(error) {
			alert.value = "Maximum cache space reached, cannot cache your playlists sorry :("
		}
	}

	function setUserGroupData(payload:UserData):void {
		userGroupData.value = payload;
		SockController.instance.user = payload;
		Store.set("userGroupData", JSON.stringify(payload));
	}

	function setLanguageCode(payload:string):void {
		lang.value = payload;
		// moment.locale(payload);
		i18n.global.locale.value = payload;
	}

	function setVolume(payload:number):void {
		volume.value = payload;
		Store.set("volume", payload.toString())
	}

	function setUserName(payload:string):void {
		userGroupData.value.name = payload;
		Store.set("userGroupData", JSON.stringify(userGroupData.value));
	}

	function setTwitchOAuthToken(payload:TwitchAuthToken):void {
		twitchOAuthToken.value = payload;
		Store.set("twitchOAuthToken", JSON.stringify(twitchOAuthToken.value));
	}

	function setTwitchLogin(payload:string):void {
		twitchLogin.value = payload;
		Store.set("twitchLogin", twitchLogin.value);
	}

	function setTwitchAllowedUsers(payload:any):void {
		twitchAllowedUsers.value = payload;
		Store.set("twitchAllowedUsers", JSON.stringify(twitchAllowedUsers.value));
	}

	async function refreshTwitchToken():Promise<void> {
		const token = await TwitchUtils.refreshToken(twitchOAuthToken.value.refresh_token);
		if(token.access_token) {
			twitchOAuthToken.value = token;
			Store.set("twitchOAuthToken", JSON.stringify(token));
		}
	}

	return {
		initComplete,
		loggedin,
		tooltip,
		alert,
		lang,
		volume,
		needUserInteraction,
		playlistsCache,
		userGroupData,
		groupRoomData,
		twitchLogin,
		twitchOAuthToken,
		twitchAllowedUsers,
		twitchPlaylists,
		twitchExpertMode,
		twitchGameState,
		twitchLeaderboard,
		twitchJoin,
		hideBackground,
		confirm,
		startApp,
		authenticate,
		setLabels,
		setPlaylistsCache,
		setUserGroupData,
		setLanguageCode,
		setVolume,
		setUserName,
		setTwitchOAuthToken,
		setTwitchLogin,
		setTwitchAllowedUsers,
		refreshTwitchToken,
	};
});
