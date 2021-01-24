
/**
 * Created by Durss
 */
export default class Config {

	private static _ENV_NAME: EnvName;

	public static MAX_TRACK_COUNT:number = 6;
	public static STORAGE_VERSION:number = 1;
	public static TWITCH_EXT_URL:string = "https://dashboard.twitch.tv/extensions/u4auavhba5b6brrtvjyjeqzhyz841b-0.0.1";

	public static init():void {
		let prod = document.location.port == "";

		if(prod) this._ENV_NAME = "prod";
		else this._ENV_NAME = "dev";
	}

	public static get IS_PROD():boolean {
		return this._ENV_NAME == "prod";
	}
	
	public static get SERVER_PORT(): number {
		return this.getEnvData({
			dev: 3004,
			prod: document.location.port,
		});
	}
	
	public static get SOCKET_PATH():string{
		if(this.IS_PROD) {
			return "/sock";
		}else{
			return window.location.origin.replace(/(.*):[0-9]+/gi, "$1")+":"+this.SERVER_PORT+"/sock";
		}
	};

	public static get SPOTIFY_CLIENT_ID():string {
		return this.getEnvData({
			dev: "944d2c2ba14745f588a370a93e56833c",
			prod: "944d2c2ba14745f588a370a93e56833c",
		});
	}

	public static get UA():string {
		return this.getEnvData({
			dev: "UA-156712572-1",
			prod: "UA-156712572-1",
		});
	}
	
	public static get API_PATH(): string {
		return this.getEnvData({
			dev: "http://localhost:"+this.SERVER_PORT+"/api",
			prod:"/api",
		});
	}
	

	/**
	 * Extract a data from an hasmap depending on the current environment.
	 * @param map
	 * @returns {any}
	 */
	private static getEnvData(map: any): any {
		//Get the data from hashmap
		if (map[this._ENV_NAME]) return map[this._ENV_NAME];
		return map[Object.keys(map)[0]];
	}
}

type EnvName = "dev" | "preprod" | "prod" | "standalone";