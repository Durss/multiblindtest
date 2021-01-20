import store from "@/store";
import { EventDispatcher } from "@/utils/EventDispatcher";
import * as tmi from "tmi.js";
import IRCEvent from "./IRCevent";

/**
* Created : 19/01/2021 
*/
export default class IRCClient extends EventDispatcher {

	private static _instance:IRCClient;
	private client:tmi.Client;
	private login:string;
	private token:string;
	private channel:string;
	
	constructor() {
		super();
	}
	
	/********************
	* GETTER / SETTERS *
	********************/
	static get instance():IRCClient {
		if(!IRCClient._instance) {
			IRCClient._instance = new IRCClient();
		}
		return IRCClient._instance;
	}
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	public initialize(login:string, token:string):Promise<void> {
		return new Promise((resolve, reject) => {
			this.login = login;
			this.token = token;
	
			this.client = new tmi.Client({
				options: { debug: true },
				connection: { reconnect: true },
				channels: [ login ],
				identity: {
					username: login,
					password: "oauth:"+token
				},
			});
	
			this.client.on("connected", (address, port)=> {
				this.client.action(this.login, "SingsNote MultiBlindtest connected");//TODO localize
				resolve();
			})
	
			this.client.on("join", (channel, username)=> {
				this.channel = channel;
			})
	
			this.client.on('message', (channel, tags, message, self) => {
				// console.log("################## ON MESSAGE ##################");
				// console.log(channel);
				// console.log(tags);
				// console.log(message);
				// console.log(self);
				// console.log(`${tags['display-name']}: ${message}`);
				if(!self) {
					// this.client.say(channel, "Yoooo");
				}
				this.dispatchEvent(new IRCEvent(IRCEvent.MESSAGE, message, <any>tags, channel, self));
			});
	
			this.client.connect();
		})
	}

	public deleteMessage(id:string):void {
		this.client.deletemessage(this.channel, id);
	}

	public sendMessage(id:string):void {
		this.client.action(this.login, id);
	}
	
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/
}



export declare module IRCTypes {

    export interface Badges {
        broadcaster: string;
    }

    export interface Tag {
        "badge-info"?: any;
        "badges": Badges;
        "client-nonce": string;
        "color": string;
        "display-name": string;
        "emotes"?: any;
        "flags"?: any;
        "id": string;
        "mod": boolean;
        "room-id": string;
        "subscriber": boolean;
        "tmi-sent-ts": string;
        "turbo": boolean;
        "user-id": string;
        "user-type"?: any;
        "emotes-raw"?: any;
        "badge-info-raw"?: any;
        "badges-raw": string;
        "username": string;
        "message-type": string;
    }

}

