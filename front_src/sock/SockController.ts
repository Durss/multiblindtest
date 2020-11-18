import router from '@/router';
import { EventDispatcher } from '@/utils/EventDispatcher';
import UserData from '@/vo/UserData';
import * as SockJS from "sockjs-client";
import Config from "../utils/Config";
import SocketEvent from "../vo/SocketEvent";

/**
 * Created by Durss on 28/03/2019
 */

export default class SockController extends EventDispatcher {

	private static _instance: SockController;

	private _user: UserData;
	private _sockjs: any;
	private _timeout: number;
	private _pingInterval: number;
	private _attempts: number;
	private _groupID : string;
	private _connected : boolean = false;
	private _enabled : boolean = false;
	private _verbose : boolean = false;

	constructor() {
		super();
		this.initialize();
	}

	/********************
	 * GETTER / SETTERS *
	 ********************/
	static get instance(): SockController {
		if (!SockController._instance) SockController._instance = new SockController();
		return SockController._instance;
	}

	public get connected():boolean {
		return this._connected;
	}

	public set user(value:UserData) {
		this._user = value;
		if(this._connected) {
			this.registerCurrentUser();
		}
	}

	public set groupId(value:string) {
		this._groupID = value;
	}


	/******************
	 * PUBLIC METHODS *
	 ******************/

	public connect() {
		if(this._verbose) console.log("SC :: connect...");
		this._enabled = true;
		if(this.connected) return;
		
		clearTimeout(this._timeout);

		if(this._sockjs) {
			//remove handlers from old sockjs
			this._sockjs.onclose = null;
			this._sockjs.onmessage = null;
			this._sockjs.onopen = null;
		}

		this._sockjs = new SockJS(Config.SOCKET_PATH);
		this._sockjs.onopen = ()=> this.onConnect();
		this._sockjs.onclose = (e)=> this.onClose(e);
		this._sockjs.onmessage = (message:string)=> this.onMessage(message);
	}

	/**
	 * Disconnects socket.
	 * Called by default on page close
	 */
	public disconnect() {
		if(this._verbose) console.log("SC :: disconnect");
		this._enabled = false;
		if(this._connected) {
			try {
				if(this._user) {
					let data = {
						user:this._user,
						groupId:this._groupID,
					}
					this._sockjs.send(JSON.stringify({action:SOCK_ACTIONS.LEAVE_ROOM, data}));
				}
			}catch(e) {
				//Ignore..
			}
		}
		this._connected = false;
		clearTimeout(this._timeout);
		this._timeout = <any>setTimeout(_=> {
			try {
				this._sockjs.close();
			}catch(e) {/*ignore*/}
		}, 500);
	}

	/**
	 * Send a message to the group
	 */
	public sendMessage(data:{action:string, data:any, includeSelf?:boolean}):void {
		if(this._verbose) console.log("SC :: sendMessage", data);
		if(!this._connected) {
			//Postpone send if connexion not yet establised
			if(this._verbose) console.log("SC :: postpone...", data)
			setTimeout(_=> this.sendMessage(data), 250);
		}else{
			if(this._verbose) console.log("SC :: sendMessage : do()")
			this._sockjs.send(JSON.stringify(data));
		}
	}


	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		window.addEventListener('beforeunload', _=> this.disconnect());
	}

	private registerCurrentUser():void {
		if(this._verbose) console.log("SC :: REGISTER USER");
		this.sendMessage({action:SOCK_ACTIONS.DEFINE_UID, data:this._user});
		if(router.currentRoute.meta.needGroupAuth) {
			this.sendMessage({action:SOCK_ACTIONS.JOIN_ROOM, data:{user:this._user}});
		}
	}

	private onConnect():void {
		if(this._verbose) console.log("SC :: onConnect");
		this._connected = true;
		this._attempts = 0;
		
		clearInterval(<any>this._pingInterval);
		this._pingInterval = <any>setInterval(_=>this.ping(), 30000);
		if(this._user) {
			this.registerCurrentUser();
		}
		this.dispatchEvent(new SocketEvent(SOCK_ACTIONS.ONLINE, null));
	}

	private ping():void {
		this._sockjs.send(JSON.stringify({action:SOCK_ACTIONS.PING}));
	}

	private onClose(e):void {
		if(this._verbose) console.log("SC :: onClose", e);
		this._connected = false;
		this.dispatchEvent(new SocketEvent(SOCK_ACTIONS.OFFLINE, null));
		clearInterval(this._pingInterval);

		if(this._enabled) {
			// Attempt to reconnect
			if(++this._attempts == 20) return;
			this.connect();
			this._timeout = <any>setTimeout(_=> this.connect(), 500 * Math.pow(this._attempts,2));
		}
	}

	private onMessage(message:any):void {
		let json:any = JSON.parse(message.data);
		// console.log("Sock message");
		// console.log(json);
		this.dispatchEvent(new SocketEvent(json.action, json.data));
	}
}

export enum SOCK_ACTIONS {
	ONLINE="ONLINE",
	OFFLINE="OFFLINE",
	PING="PING",
	DEFINE_UID="DEFINE_UID",
	JOIN_ROOM="JOIN_ROOM",
	LEAVE_ROOM="LEAVE_ROOM",
	START_GROUP_GAME="START_GROUP_GAME",
	TRACKS_DATA="TRACKS_DATA",
	GUESSED_TRACK="GUESSED_TRACK",
	PLAYER_PASS="PLAYER_PASS",
	PLAYER_KICKED="PLAYER_KICKED",
	UPDATE_HANDICAP="UPDATE_HANDICAP",
	UPDATE_USERNAME="UPDATE_USERNAME",
	CHAT_MESSAGE="CHAT_MESSAGE",
	RESTART_GROUP_GAME="RESTART_GROUP_GAME",
};