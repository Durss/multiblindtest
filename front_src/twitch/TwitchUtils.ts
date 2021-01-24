/**
* Created : 19/01/2021 
*/
export default class TwitchUtils {
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