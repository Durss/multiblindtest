import Config from "@/utils/Config";

/**
* Created : 19/01/2021 
*/
export default class TwitchUtils {
	public static requestDCF():Promise<TwitchAuthToken> {
		return new Promise<TwitchAuthToken>(async (resolve, reject) => {
			const url = new URL("https://id.twitch.tv/oauth2/device");
			url.searchParams.append("client_id", Config.TWITCH_CLIENT_ID);
			url.searchParams.append("scopes", "chat:edit chat:read");
			const res = await fetch(url.toString(), {method:"POST"});
			const json = await res.json();
			window.open(json.verification_uri, "_blank");
	
			const interval = setInterval(async () => {
				const url = new URL("https://id.twitch.tv/oauth2/token");
				url.searchParams.append("client_id", Config.TWITCH_CLIENT_ID);
				url.searchParams.append("scopes", "chat:edit chat:read");
				url.searchParams.append("device_code", json.device_code);
				url.searchParams.append("grant_type", "urn:ietf:params:oauth:grant-type:device_code");
				const resLoc = await fetch(url.toString(), {method:"POST"});
				const jsonLoc = await resLoc.json();
				if(jsonLoc.access_token) {
					clearInterval(interval);
					resolve(jsonLoc as TwitchAuthToken);
				}
			}, json.interval * 1000);
		});
	}

	public static refreshToken(refresh_token:string):Promise<TwitchAuthToken> {
		return new Promise<TwitchAuthToken>(async (resolve, reject) => {
			const url = new URL("https://id.twitch.tv/oauth2/token");
			url.searchParams.append("client_id", Config.TWITCH_CLIENT_ID);
			url.searchParams.append("scopes", "chat:edit chat:read");
			url.searchParams.append("refresh_token", refresh_token);
			url.searchParams.append("grant_type", "refresh_token");
			const res = await fetch(url.toString(), {method:"POST"});
			const json = await res.json();
			resolve(json);
		});
	}

	public static validateToken(oAuthToken:string):Promise<{expires_in:number, client_id:string, login:string, user_id:string; scopes:string[]}> {
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

	public static broadcastToExtension(channelId:string, token:string, clientId:string):Promise<boolean> {
		return new Promise((resolve, reject)=> {
			let headers:any = {
				"Authorization":"Bearer "+token,
				"Client-Id": clientId,
				"Content-Type": "application/json",
			};
			var options = {
				method: "POST",
				headers: headers,
			};

			let body = JSON.stringify({
				
			})
			fetch("https://api.twitch.tv/extensions/message/"+channelId, options)
			.then((result) => {
				if(result.status == 200) {
					result.json().then((json)=> {
						resolve(json)
					});
				}else{
					resolve(null);
				}
			});
			resolve(true);
		})
	}
}

export interface TwitchAuthToken {
	access_token: string,
	expires_in: number,
	refresh_token: string,
	scope: string[],
	token_type: "bearer"
}