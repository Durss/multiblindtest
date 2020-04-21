import Config from '@/utils/Config';

export default class Api {

	public static get(endpoint: string, params: any = null, headers: any = null, setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		return this._call(endpoint, params, headers, 'GET', setDefaultheader, autoPrefixApiPath);
	}
	public static post(endpoint: string, params: any = null, headers: any = null, setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		return this._call(endpoint, params, headers, 'POST', setDefaultheader, autoPrefixApiPath);
	}
	public static put(endpoint: string, params: any = null, headers: any = null, setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		return this._call(endpoint, params, headers, 'PUT', setDefaultheader, autoPrefixApiPath);
	}
	public static patch(endpoint: string, params: any = null, headers: any = null, setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		return this._call(endpoint, params, headers, 'PATCH', setDefaultheader, autoPrefixApiPath);
	}
	public static delete(endpoint: string, params: any = null, headers: any = null, setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		return this._call(endpoint, params, headers, 'DELETE', setDefaultheader, autoPrefixApiPath);
	}

	protected static _call(endpoint: string, params: any = null, headers: any = null, verb: string = 'GET', setDefaultheader:boolean = true, autoPrefixApiPath:boolean = true): Promise<any> {
		let _headers:any = {};
		if(setDefaultheader) {
			_headers["Content-Type"] = "application/json";
		}
		if (headers) {
			for(let key in headers) {
				_headers[key] = headers[key];
			}
		}
		var options = {
			method: verb,
			headers: _headers
		};
		
		let url = endpoint;
		if(autoPrefixApiPath) url = Config.API_PATH + "/" + url;
		if (verb == 'GET' && params != null) {
			let chunks = [];
			for (let key in params) {
				chunks.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
			}
			url += (url.indexOf("?") == -1? "?" : "") + chunks.join("&");
			params = null;
		}
		// let url = "//" + document.location.hostname + ":" + Config.API_PORT + '/api/' + api_version + "/" + endpoint;
		params = (params && _headers["Content-Type"] == "application/json" && typeof params != "string") ? JSON.stringify(params) : params;
		return this._sendRequest(url, options, params);
	}



	protected static _sendRequest(url:string, options: any, bodyParams?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if(bodyParams) {
				options.body = bodyParams;
			}
			fetch(url, options)
			.then((result) => {
				if(result.status == 200) {
					result.text().then((text)=> {
						let json:any;
						try {
							json = JSON.parse(text);
						}catch(error) {
							//JSON parse failed, return error
							reject({code:"unknown", message:text.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")});
							return;
						}
						if(json.success === false) {
							//Status 200 but JSON says there's an error
							reject(json);
						}else if(json.data){
							resolve(json.data);
						}else{
							resolve(json);
						}
					}).catch(_=> {
						reject({code:"unknown", message:"Unable to decode query result"});
					});
				}else{
					result.text().then((text)=> {
						let json:any;
						try {
							json = JSON.parse(text);
						}catch(error) {
							//JSON parse failed, return error
							reject({code:"unknown", message:text.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")});
							return;
						}
						reject(json);
					}).catch(_=> {
						reject({code:"unknown", message:"Unable to decode query result"});
					});
				}
			}).catch((error) => {
				reject(error);
			});
		});
    }
}