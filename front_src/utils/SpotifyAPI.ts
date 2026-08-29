import Config from './Config';
import { Route } from 'vue-router';
import Store from '@/store/Store';
import Utils from './Utils';

export default class SpotifyAPI {

	private static _instance: SpotifyAPI;
	private static AUTH_ATTEMPT_KEY: string = "spotify_auth_attempt";
	private static AUTH_LOOP_DURATION: number = 60 * 1000;

	private access_token: string = null;
	private refreshPromise: Promise<boolean> = null;

	constructor() {
		this.initialize();
	}



	/********************
	 * GETTER / SETTERS *
	 ********************/

	/**
	 * Gets the singleton's reference
	 */
	public static get instance(): SpotifyAPI {
		if (!this._instance) this._instance = new SpotifyAPI();
		return this._instance;
	}

	public get hasAccessToken():boolean {
		return this.access_token != null;
	}



	/******************
	 * PUBLIC METHODS *
	 ******************/
	/**
	 * Call a spotify endpoint
	 */
	public async call(endpoint: string, params?: any, autoAuth:boolean = true, isRetry:boolean = false): Promise<any> {
		let url = "https://api.spotify.com/"+endpoint;

		if(params) {
			var query = Object.keys(params)
				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
				.join('&');
			url += "?" + query
		}

		let headers = new Headers();
		//Spotify dropped support for the "access_token" query parameter. The token
		//MUST be sent through this header or EVERY call answers a 401, even with
		//a token issued a second ago.
		headers.append("Authorization", "Bearer " + this.access_token);
		let options = {
			method: "GET",
			headers
		};
		let result = await fetch(url, options);
		if(result.status == 401) {
			//Token expired or revoked. Try to refresh it silently before sending
			//the user through the whole OAuth process again.
			if(!isRetry && await this.refreshToken()) {
				return this.call(endpoint, params, autoAuth, true);
			}
			if(autoAuth) {
				this.startAuthFlow(document.location.href);
			}
			return Promise.reject();
		}
		if(result.status == 429) {
			//When reaching the max rate limit of spotify API this status is returned
			//along with a "retry-after" header containing the number of seconds to
			//wait before executing a new request
			return new Promise((resolve, reject) => {
				//Wait for the requested amount of time and reissue the query
				setTimeout(async ()=> {
					try {
						let res = await this.call(endpoint, params, autoAuth, isRetry);
						resolve(res);
					}catch(error) {
						reject(error);
					}
				}, parseInt(result.headers.get("retry-after")) * 1000+500);
			})
		}
		if(result.status == 200) {
			//A call went through, we're not looping on authentication. Allow a new
			//OAuth redirection if a future call fails.
			Store.remove(SpotifyAPI.AUTH_ATTEMPT_KEY);
			return await result.json();
		}else{
			return Promise.reject();
		}
	}

	/**
	 * Register the current access token for spotify api calls
	 */
	public initFromStore():boolean {
		const token = Store.get("spotify_access_token");
		if(token && token != "undefined") {
			this.access_token = token;
			return true;
		}
		return false;
	}

	/**
	 * Clears any stored credential
	 */
	public logout():void {
		this.access_token = null;
		Store.remove("spotify_access_token");
		Store.remove("spotify_refresh_token");
		Store.remove("expirationDate");
	}

	/**
	 * Starts OAuth process for user authentication
	 */
	public async authenticate():Promise<void> {
		const url = await this.getAuthUrl();
		document.location.href = url;
	}

	/**
	 * Get OAuth url
	 */
	public async getAuthUrl():Promise<string> {
		const url = document.location.protocol+"//"+document.location.host+"/oauth";
		const redir = encodeURIComponent(url);
		const clientID = Config.SPOTIFY_CLIENT_ID;
		const scopes = encodeURIComponent("playlist-read-private playlist-read-collaborative");
		const codeVerifier = Utils.generateRandomString(64);
		const hash = await Utils.sha256(codeVerifier);
		const codeChallenge = btoa(String.fromCharCode(...Array.from(new Uint8Array(hash))))
					.replace(/=/g, '')
					.replace(/\+/g, '-')
					.replace(/\//g, '_');
		Store.set("code_verifier", codeVerifier);
		// return "https://accounts.spotify.com/authorize?client_id="+clientID+"&scope="+scopes+"&redirect_uri="+redir+"&response_type=code";
		return "https://accounts.spotify.com/authorize?client_id="+clientID+"&scope="+scopes+"&redirect_uri="+redir+"&response_type=code&code_challenge_method=S256&code_challenge="+codeChallenge;
	}

	/**
	 * Refresh the access token if it expired.
	 * Falls back on a full OAuth process if it cannot be refreshed.
	 */
	public async refreshTokenIfNecessary(redirTo:Route):Promise<void> {
		if(!this.isTokenExpired()) return;

		//Try a silent refresh first, the user won't notice anything
		if(await this.refreshToken()) return;

		let redirUrl = document.location.href;
		if(redirTo) {
			redirUrl = window.location.protocol+"//"+window.location.host+redirTo.path;
		}
		this.startAuthFlow(redirUrl);
		//Reject so the caller aborts what it was doing, we're leaving the page
		return Promise.reject();
	}

	/**
	 * Get a new access token from the refresh token.
	 * Returns false if there's no refresh token or if it got revoked.
	 */
	public refreshToken():Promise<boolean> {
		if(!this.refreshPromise) {
			this.refreshPromise = this.doRefreshToken();
			this.refreshPromise.then(()=> this.refreshPromise = null,
									()=> this.refreshPromise = null);
		}
		return this.refreshPromise;
	}

	/**
	 * Check if token expired
	 */
	public isTokenExpired():boolean {
		let minutesBeforeExpiration = 2;
		let expirationDate = parseInt(Store.get("expirationDate"));
		return !expirationDate || isNaN(expirationDate) || (new Date().getTime() + minutesBeforeExpiration * 60 * 1000) > expirationDate;

	}

	/**
	 * Exchange PKCE code for access token
	 * @param code
	 * @returns
	 */
	public async getToken(code: string): Promise<boolean> {
		// stored in the previous step
		const codeVerifier = Store.get("code_verifier");
		const url = "https://accounts.spotify.com/api/token";
		const redirectUri = document.location.protocol+"//"+document.location.host+"/oauth";
		const payload = {
			method: 'POST',
			headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: Config.SPOTIFY_CLIENT_ID,
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri,
				code_verifier: codeVerifier,
			}),
		}

		try {
			const body = await fetch(url, payload);
			if(body.status < 200 || body.status > 204) {
				const response = await body.json();
				console.log(response)
				return false;
			}else{
				const response = await body.json();
				if(response.access_token) {
					this.storeToken(response);
					return true;
				}
			}
		}catch(error) {
			console.error("Error getting spotify token", error);
		}
		return false;
	}



	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		if(Store.get("spotify_access_token")) {
			this.access_token = Store.get("spotify_access_token");
		}
	}

	/**
	 * Stores an access token returned by spotify's token endpoint
	 */
	private storeToken(response:any):void {
		this.access_token = response.access_token;
		let expirationDate:number = new Date().getTime() + parseInt(response.expires_in) * 1000;
		Store.set("spotify_access_token", response.access_token);
		Store.set("expirationDate", expirationDate.toString());
		//Not always sent back when refreshing, keep the previous one in that case
		if(response.refresh_token) {
			Store.set("spotify_refresh_token", response.refresh_token);
		}
	}

	/**
	 * Actual refresh token request.
	 */
	private async doRefreshToken():Promise<boolean> {
		const refreshToken = Store.get("spotify_refresh_token");
		if(!refreshToken || refreshToken == "undefined") return false;

		const payload = {
			method: 'POST',
			headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: Config.SPOTIFY_CLIENT_ID,
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			}),
		}

		try {
			const body = await fetch("https://accounts.spotify.com/api/token", payload);
			const response = await body.json();
			if(body.status < 200 || body.status > 204 || !response.access_token) {
				console.log("Failed refreshing spotify token", response);
				//Refresh token got revoked, drop it so we don't retry on every call
				Store.remove("spotify_refresh_token");
				return false;
			}
			this.storeToken(response);
			return true;
		}catch(error) {
			console.error("Error refreshing spotify token", error);
			return false;
		}
	}

	/**
	 * Start auth flow
	 */
	private startAuthFlow(redirectTo:string):boolean {
		const lastAttempt = parseInt(Store.get(SpotifyAPI.AUTH_ATTEMPT_KEY));
		if(!isNaN(lastAttempt) && new Date().getTime() - lastAttempt < SpotifyAPI.AUTH_LOOP_DURATION) {
			//We came back from spotify less than a minute ago and the API still
			//answers 401. Stop here instead of bouncing forever.
			console.error("Spotify authentication loop detected. The API rejects a freshly issued token, aborting authentication.");
			Store.remove(SpotifyAPI.AUTH_ATTEMPT_KEY);
			this.logout();
			return false;
		}
		Store.set(SpotifyAPI.AUTH_ATTEMPT_KEY, new Date().getTime().toString());
		Store.set("redirect", redirectTo);
		this.authenticate();
		return true;
	}
}
