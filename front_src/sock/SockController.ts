import { EventDispatcher } from '@/utils/EventDispatcher';
import * as SockJS from "sockjs-client";
import Config from "../utils/Config";
import SocketEvent from "../vo/SocketEvent";
import store from '@/store';
import UserData from '@/vo/UserData';

/**
 * Created by FDursus on 28/03/2019
 */

export default class SockController extends EventDispatcher {

	private static _instance: SockController;

	private _user: UserData;
	private _sockjs: any;
	private _timeout: number;
	private _pingInterval: number;
	private _attempts: number;
	private _connected : boolean = false;

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

	public set user(value:UserData) {
		this._user = value;
		if(this._connected) {
			this.registerCurrentUser();
		}else{
		}
	}


	/******************
	 * PUBLIC METHODS *
	 ******************/

	public connect() {
		// if(this._sockjs) return;

		//@ts-ignore
		this._sockjs = new SockJS(Config.SOCKET_PATH);
		this._sockjs.onclose = ()=> this.onClose();
		this._sockjs.onmessage = (message:string)=> this.onMessage(message);
		this._sockjs.onopen = ()=> this.onConnect();

		window.addEventListener('beforeunload', _=> this.disconnect());
	}

	public disconnect() {
		if(this._connected) {
			try {
				if(this._user) {
					this._sockjs.send(JSON.stringify({action:SOCK_ACTIONS.LEAVE_ROOM, data:this._user}));
				}
			}catch(e) {
				//Ignore..
			}
		}
		this._connected = false;
		clearTimeout(this._timeout);
		this._timeout = <any>setTimeout(_=> this._sockjs.close(), 500);
	}

	public sendMessage(data:{action:string, data:any, includeSelf?:boolean}):void {
		if(!this._connected) {
			//Postpone send if connexion not yet establised
			setTimeout(_=> this.sendMessage(data), 250);
		}else{
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
	}

	private registerCurrentUser():void {
		this.sendMessage({action:SOCK_ACTIONS.DEFINE_UID, data:this._user});
		this.sendMessage({action:SOCK_ACTIONS.JOIN_ROOM, data:this._user});
	}

	private onConnect():void {
		this._connected = true;
		this._attempts = 0;
		
		clearInterval(<any>this._pingInterval);
		this._pingInterval = <any>setInterval(_=>this.ping(), 30000);
		if(this._user) {
			this.registerCurrentUser();
		}
	}

	private ping():void {
		this._sockjs.send(JSON.stringify({action:SOCK_ACTIONS.PING}));
	}

	private onClose():void {
		this._connected = false;
		clearInterval(<any>this._pingInterval);
		if(++this._attempts == 10) return;
		this._timeout = <any>setTimeout(_=> this.connect(), 10000);
	}

	private onMessage(message:any):void {
		let json:any = JSON.parse(message.data);
		// console.log("Sock message");
		// console.log(json);
		this.dispatchEvent(new SocketEvent(json.action, json.data));
	}
}

export enum SOCK_ACTIONS {
	PING="PING",
	DEFINE_UID="DEFINE_UID",
	JOIN_ROOM="JOIN_ROOM",
	LEAVE_ROOM="LEAVE_ROOM",
	START_GROUP_GAME="START_GROUP_GAME",
	TRACKS_DATA="TRACKS_DATA",
	GUESSED_TRACK="GUESSED_TRACK",
};