import * as fs from "fs";
import Logger, { LogStyle } from "../utils/Logger";
/**
 * Created by Durss
 */
export default class Config {

	private static _ENV_NAME: EnvName;
	private static _CONF_PATH: string = "env.conf";
	private static _PRIVATE_CREDENTIALS: any;

	public static get SECRET(): string {
		return this._PRIVATE_CREDENTIALS["SECRET"];
	}
	public static get EXTSECRET(): string {
		return this._PRIVATE_CREDENTIALS["EXTSECRET"];
	}
	public static get OWNERID(): string {
		return this._PRIVATE_CREDENTIALS["OWNERID"];
	}
	public static get CLIENTID(): string {
		return this._PRIVATE_CREDENTIALS["CLIENTID"];
	}
	public static get EXTVERSION(): string {
		return this._PRIVATE_CREDENTIALS["EXTVERSION"];
	}
	public static get SMS_KEY(): string {
		return this._PRIVATE_CREDENTIALS["SMS_KEY"];
	}
	public static get SMS_USER(): string {
		return this._PRIVATE_CREDENTIALS["SMS_USER"];
	}

	public static async loadPrivateCredentials():Promise<void> {
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
			this._PRIVATE_CREDENTIALS = {};
			let chunks = creds.toString().replace(/(\r|\n){2,}/gi, "\r").split(/\r|\n/gi);
			for (let i = 0; i < chunks.length; i++) {
				const [id, value] = chunks[i].split(";");
				// this[id] = value.replace(/"/gi, "");
				this._PRIVATE_CREDENTIALS[id] = value.replace(/"/gi, "");
			}

		} else {
			Logger.error("MISSING FILE \"credentials.conf\" contianing Twitch credentials");
			Logger.error("The file has been created, please fill the missing key values");
			fs.writeFileSync("credentials.conf", `SECRET;xxx
EXTSECRET;xxx
CLIENTID;xxx
OWNERID;xxx
EXTVERSION;xxx
SMS_KEY;xxx
SMS_USER;xxx`);
		}
	}


	public static get LOGS_ENABLED(): boolean {
		return this.getEnvData({
			dev: true,
			prod: false,
		});
	}

	public static get SERVER_PORT(): number {
		return this.getEnvData({
			dev: 3004,
			prod: 3004,
		});
	}
	
	public static get PUBLIC_PATH(): string {
		return this.getEnvData({
			dev: "./dist",
			prod: "./public",
		});
	}

	public static get SERVER_NAME(): string {
		return this.getEnvData({
			dev: "",
			prod: "",
		});
	}


	/**
	 * Extract a data from an hasmap depending on the current environment.
	 * @param map
	 * @returns {any}
	 */
	private static getEnvData(map: any): any {
		//Grab env name the first time
		if (!this._ENV_NAME) {
			if (fs.existsSync(this._CONF_PATH)) {
				let content: string = fs.readFileSync(this._CONF_PATH, "utf8");
				this._ENV_NAME = <EnvName>content;
				let str: String = "  :: Current environment \"" + content + "\" ::  ";
				let head: string = str.replace(/./g, " ");
				console.log("\n");
				console.log(LogStyle.BgGreen + head + LogStyle.Reset);
				console.log(LogStyle.Bright + LogStyle.BgGreen + LogStyle.FgWhite + str + LogStyle.Reset);
				console.log(LogStyle.BgGreen + head + LogStyle.Reset);
				console.log("\n");
				
			} else {
				this._ENV_NAME = "dev";
				fs.writeFileSync(this._CONF_PATH, this._ENV_NAME);
				let str: String = "  /!\\ Missing file \"./" + this._CONF_PATH + "\" /!\\  ";
				let head: string = str.replace(/./g, " ");
				console.log("\n");
				console.log(LogStyle.BgRed + head + LogStyle.Reset);
				console.log(LogStyle.Bright + LogStyle.BgRed + LogStyle.FgWhite + str + LogStyle.Reset);
				console.log(LogStyle.BgRed + head + LogStyle.Reset);
				console.log("\n");
				console.log("Creating env.conf file autmatically and set it to \"standalone\"\n\n");
			}
		}

		//Get the data from hashmap
		if (map[this._ENV_NAME]) return map[this._ENV_NAME];
		return map[Object.keys(map)[0]];
	}
}

type EnvName = "dev" | "preprod" | "prod";