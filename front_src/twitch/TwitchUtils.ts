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
}