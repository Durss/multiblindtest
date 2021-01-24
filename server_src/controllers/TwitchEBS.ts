import * as fs from "fs";
import Logger from "../utils/Logger";
import * as jsonwebtoken from "jsonwebtoken";
import fetch from "node-fetch";

/**
* Created : 23/01/2021 
*/
export default class TwitchEBS {

	private static _instance: TwitchEBS;

	private SECRET: string;
	private SECRETEXT: string;
	private OWNERID: string;
	private CLIENTID: string;

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
		this.loadConfs();
	}


	public broadcast(channelId: string, message:string):void {
		console.log("Broadcast \" "+message+"\" to channel "+channelId);
		// Set the HTTP headers required by the Twitch API.
		const headers = {
			'Client-Id': this.CLIENTID,
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
				Logger.info("Broadcast done to channel "+channelId);
				// result.text().then((t) => {
				// 	console.log(">",t);
				// })
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
			"Client-Id":this.CLIENTID,
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



	/*******************
	* PRIVATE METHODS *
	*******************/

	private async loadConfs(): Promise<void> {
		let url = "credentials.conf";
		let creds;
		if (fs.existsSync(url)) {
			creds = fs.readFileSync(url);
		} else {
			url = "./server_src/" + url;
			if (fs.existsSync(url)) {
				creds = fs.readFileSync(url);
			}
		}
		if (creds) {
			let chunks = creds.toString().replace(/(\r|\n){2,}/gi, "\r").split(/\r|\n/gi);
			for (let i = 0; i < chunks.length; i++) {
				const [id, value] = chunks[i].split(";");
				this[id] = value.replace(/"/gi, "");
			}

		} else {
			Logger.error("MISSING FILE \"credentials.conf\" contianing Twitch credentials");
			Logger.error("The file has been created, please fill the missing keys");
			fs.writeFileSync("credentials.conf", `SECRET;xxx
SECRETEXT;xxx
CLIENTID;xxx
OWNERID;xxx`);
		}
	}

	private makeServerToken(channelId: string): string {
		const payload = {
			exp: Math.floor(Date.now() / 1000) + 30,
			channel_id: channelId,
			user_id: this.OWNERID,
			role: 'external',
			pubsub_perms: {
				send: ['*'],
			},
		};
		console.log(this.OWNERID);
		return jsonwebtoken.sign(payload, Buffer.from(this.SECRETEXT, "base64"), { algorithm: 'HS256' });
	}

	private getClientCredentialToken(scope:string="channel:read:redemptions+channel:moderate+channel_subscriptions+bits:read"):Promise<string> {

		return new Promise((resolve, reject) => {
			let headers:any = {
			};
			var options = {
				method: "POST",
				headers: headers,
			};
			fetch("https://id.twitch.tv/oauth2/token?client_id="+this.CLIENTID+"&client_secret="+this.SECRET+"&grant_type=client_credentials&scope="+scope, options)
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