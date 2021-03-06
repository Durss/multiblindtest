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
	private isConnected:boolean = false;
	
	public token:string;
	public channel:string;
	
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

	public get connected():boolean {
		return this.isConnected;
	}
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	public initialize(login:string, token:string):Promise<void> {
		return new Promise((resolve, reject) => {
			this.login = login;
			this.token = token;
	
			this.client = new tmi.Client({
				options: { debug: false },
				connection: { reconnect: true },
				channels: [ login ],
				identity: {
					username: login,
					password: "oauth:"+token
				},
			});
	
			this.client.on("join", (channel, user, test)=> {
				this.channel = channel;
				if(user == this.login) {
					// this.client.action(this.login, "SingsNote MultiBlindtest connected");//TODO localize
					this.isConnected = true;
					// console.log(reason);
					resolve();
				}
			});

			//@ts-ignore dirty system event listener because i foudn no other
			//way to capture a connexion error...
			this.client.on("_promiseJoin", (message:string)=> {
				if(message && message.toLowerCase().indexOf("no response") > -1) {
					console.log("IRCClient :: Connection failed");
					reject();
				}
			});
			this.client.on("disconnected", (message:string)=> {
				console.log("IRCClient :: Disconnected");
				if(!this.isConnected) {
					reject();
				}
				this.isConnected = false;
			});
	
			// this.client.on('raw_message', (messageCloned, message) => {
			// 	console.log("################## ON RAW ##################");
			// 	console.log(messageCloned);
			// 	console.log(message);
			// })
			this.client.on('message', (channel, tags, message, self) => {
				// console.log("################## ON MESSAGE ##################");
				// console.log(channel);
				// console.log(tags);
				// console.log(message);
				// console.log(self);
				// console.log(`${tags.username}: ${message}`);
				// if(!self) {
					// this.client.say(channel, "Yoooo");
				// }
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

