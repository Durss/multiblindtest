import * as jsonwebtoken from "jsonwebtoken";
import fetch from "node-fetch";
import Config from "../utils/Config";
import Logger from "../utils/Logger";

/**
* Created : 23/01/2021 
*/
export default class TwitchEBS {

	private static _instance: TwitchEBS;

	constructor() {

	}

	/********************
	* GETTER / SETTERS *
	********************/
	static get instance(): TwitchEBS {
		if (!TwitchEBS._instance) {
			TwitchEBS._instance = new TwitchEBS();
		}
		return TwitchEBS._instance;
	}



	/******************
	* PUBLIC METHODS *
	******************/
	public initialize(): void {
		
	}


	public broadcast(channelId: string, message:string):void {
		// console.log("Broadcast \" "+message+"\" to channel "+channelId);
		// Set the HTTP headers required by the Twitch API.
		const headers = {
			'Client-Id': Config.CLIENTID,
			'Content-Type': 'application/json',
			'Authorization': "Bearer " + this.makeServerToken(channelId),
		};

		// Create the POST body for the Twitch API request.
		const body = JSON.stringify({
			content_type: 'application/json',
			message: message,
			targets: ['broadcast'],
		});

		var options = {
			method: "POST",
			headers: headers,
			body,
		};

		fetch("https://api.twitch.tv/extensions/message/" + channelId, options)
		.then((result) => {
			if (result.status == 204) {
				// Logger.info("Broadcast done to channel "+channelId);
			} else {
				Logger.error("ERROR");
				result.text().then((t) => {
					console.log(t);
				})
			}
		});
	}

	public async getChannelInfo(userId:string):Promise<any> {
		let token = await this.getClientCredentialToken();

		let headers:any = {
			"Client-Id":Config.CLIENTID,
			"Authorization":"Bearer "+token
		};
		var options = {
			method: "GET",
			headers: headers,
		};
		let result = await fetch("https://api.twitch.tv/helix/channels?broadcaster_id="+userId, options)
		if(result.status == 200) {
			let json = await result.json();
			console.log("Channel infos:");
			console.log(json);
			return json.data[0];
		}else{
			Logger.error("Unable to get channel info for USER ID "+userId);
			return null;
		}
	}

	public validateToken(oAuthToken:string):Promise<any> {
		return new Promise((resolve, reject) => {
			let headers:any = {
				"Authorization":"OAuth "+oAuthToken
			};
			var options = {
				method: "GET",
				headers: headers,
			};
			fetch("https://id.twitch.tv/oauth2/validate", options)
			.then((result) => {
				if(result.status == 200) {
					result.json().then((json)=> {
						resolve(json)
					});
				}else{
					resolve(null);
				}
			});
		});
	}

	public async sendToChat(channelId:string, message:string, token:string):Promise<void> {
		let headers:any = {
			"Client-Id":Config.CLIENTID,
			"Content-Type":"application/json",
			'Authorization': "Bearer " + token,
		};
		let options = {
			method: "POST",
			headers,
			body:JSON.stringify({text:message})
		};
		let url = "https://api.twitch.tv/extensions/"+Config.CLIENTID+"/"+Config.EXTVERSION+"/channels/"+channelId+"/chat";
		let result = await fetch(url, options);
		console.log("SEND TOT CHAT RESULT !");
		console.log(result.status);
		console.log(await result.text());
	}



	/*******************
	* PRIVATE METHODS *
	*******************/

	private makeServerToken(channelId: string): string {
		const payload = {
			exp: Math.floor(Date.now() / 1000) + 30,
			channel_id: channelId,
			user_id: Config.OWNERID,
			role: 'external',
			pubsub_perms: {
				send: ['broadcast'],
			},
		};
		return jsonwebtoken.sign(payload, Buffer.from(Config.EXTSECRET, "base64"), { algorithm: 'HS256' });
	}

	private getClientCredentialToken(scope:string="channel:read:redemptions+channel:moderate+channel_subscriptions+bits:read"):Promise<string> {

		return new Promise((resolve, reject) => {
			let headers:any = {
			};
			var options = {
				method: "POST",
				headers: headers,
			};
			fetch("https://id.twitch.tv/oauth2/token?client_id="+Config.CLIENTID+"&client_secret="+Config.SECRET+"&grant_type=client_credentials&scope="+scope, options)
			.then((result) => {
				if(result.status == 200) {
					result.json().then((json)=> {
						resolve(json.access_token);
					});
				}else{
					reject();
				}
			});
		})
	}
}