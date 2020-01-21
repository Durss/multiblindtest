
/**
 * Created by Durss
 */
export default class Config {

	private static _ENV_NAME: EnvName;

	public static TRACKS_COUNT:number = 6;

	public static init():void {
		let path = document.location.host;

		//Check in which env we are running depending on the current URL
		let dev = /^(localhost|127.0.0.1)/gi.test(path);
		let prod = document.location.port != "8080" && document.location.port != "8081";

		if(prod) this._ENV_NAME = "prod";
		else if(dev) this._ENV_NAME = "dev";
	}
	

	public static get SERVER_PORT(): number {
		return this.getEnvData({
			dev: 3002,
			prod: document.location.port,
		});
	}

	public static get SPOTIFY_CLIENT_ID():string {
		return this.getEnvData({
			dev: "944d2c2ba14745f588a370a93e56833c",
			prod: "944d2c2ba14745f588a370a93e56833c",
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