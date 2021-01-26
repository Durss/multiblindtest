import Config from './Config';
import { Route } from 'vue-router';
import Store from '@/store/Store';

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
	public setToken(token:string):void {
		this.access_token = token;
		Store.set("access_token", token);
	}

	/**
	 * Starts OAuth process for user authentication
	 */
	public authenticate():void {
		document.location.href = this.getAuthUrl();
	}

	/**
	 * Get OAuth url
	 */
	public getAuthUrl():string {
		let url = document.location.protocol+"//"+document.location.host+"/oauth";
		let redir = encodeURIComponent(url);
		let clientID = Config.SPOTIFY_CLIENT_ID;
		let scopes = encodeURIComponent("playlist-read-private playlist-read-collaborative");
		return "https://accounts.spotify.com/authorize?client_id="+clientID+"&scope="+scopes+"&redirect_uri="+redir+"&response_type=token";
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



	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		if(Store.get("access_token")) {
			this.access_token = Store.get("access_token");
		}
	}
}