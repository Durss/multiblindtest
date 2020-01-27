import Config from './Config';

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



	/******************
	 * PUBLIC METHODS *
	 ******************/
	/**
	 * Call a spotify endpoint
	 */
	public async call(endpoint: string, params?: any): Promise<any> {
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
			localStorage.setItem("redirect", document.location.href);//will allow to redirect the user to the current page after oauth result
			this.authenticate();
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
		return await result.json();
	}

	/**
	 * Register the current access token for spotify api calls
	 */
	public setToken(token:string):void {
		this.access_token = token;
		localStorage.setItem("access_token", token);
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
	public refreshTokenIfNecessary():Promise<void> {
		return new Promise((resolve, reject) => {
			if(this.isTokenExpired()) {
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
		let expirationDate = parseInt(localStorage.getItem("expirationDate"));
		return !expirationDate || isNaN(expirationDate) || (new Date().getTime() + minutesBeforeExpiration * 60 * 1000) > expirationDate;

	}



	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		if(localStorage.getItem("access_token")) {
			this.access_token = localStorage.getItem("access_token");
		}
	}
}