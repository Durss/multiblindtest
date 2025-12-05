import Config from './Config';
import { Route } from 'vue-router';
import Store from '@/store/Store';
import Utils from './Utils';

export default class SpotifyAPI {

	private static _instance: SpotifyAPI;

	private access_token: string = null;

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
	public async call(endpoint: string, params?: any, autoAuth:boolean = true): Promise<any> {
		let url = "https://api.spotify.com/"+endpoint+"?access_token=" + this.access_token;

		if(params) {
			var query = Object.keys(params)
				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
				.join('&');
			url += "&" + query
		}

		let headers = new Headers();
		let options = {
			method: "GET",
			headers
		};
		let result = await fetch(url, options);
		if(result.status == 401) {
			Store.set("redirect", document.location.href);//will allow to redirect the user to the current page after oauth result
			if(autoAuth) {
				this.authenticate();
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
					let res = await this.call(endpoint, params);
					resolve(res);
				}, parseInt(result.headers.get("retry-after")) * 1000+500);
			})
		}
		if(result.status == 200) {
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
	 * Restart an OAuth process if the access token expired
	 */
	public refreshTokenIfNecessary(redirTo:Route):Promise<void> {
		return new Promise((resolve, reject) => {
			if(this.isTokenExpired()) {
				if(redirTo) {
					let redirUrl = window.location.protocol+"//"+window.location.host+redirTo.path;
					Store.set("redirect", redirUrl);
				}
				this.authenticate();
				reject();
			}else{
				resolve();
			}
		})
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
					this.access_token = response.access_token;
					let expirationDate:number = new Date().getTime() + parseInt(response.expires_in) * 1000;
					Store.set("spotify_access_token", response.access_token);
					Store.set("expirationDate", expirationDate.toString());
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
}