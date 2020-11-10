import * as sockjs from "sockjs";
import {Connection, ServerOptions} from "sockjs";
import Logger, { LogStyle } from "../utils/Logger";
import UserData from "../vo/UserData";
import Config from "../utils/Config";
/**
 * Created by FDursus on 28/03/2019
 */

export default class SocketServer {

	public onUserDisconnect:Function;
	public onUserConnect:Function;
	public onUpdateUser:Function;

	private static _instance: SocketServer;
	private _DISABLED: boolean = false;
	private _sockjs: any;
	private _connections:Connection[];
	private _connectionToUid:{ [id: string] : string; };
	private _uidToConnection:{ [id: string] : Connection; };
	private _groupIdToUsers:{[id:string]:UserData[]} = {};
	private _userIdToGroupId:{[id:string]:string} = {};

	constructor() {
		this.initialize();
	}

	/********************
	 * GETTER / SETTERS *
	 ********************/
	static get instance(): SocketServer {
		if (!SocketServer._instance) SocketServer._instance = new SocketServer();
		return SocketServer._instance;
	}


	/******************
	 * PUBLIC METHODS *
	 ******************/

	public connect() {
		if(this._DISABLED) return;
		this._sockjs = sockjs.createServer({log: (severity, message)=> {
			if(severity == "debug") {
				Logger.success(message+" on port "+Config.SERVER_PORT);
				return;
			}
		}});
		this._sockjs.on("connection", (conn:Connection)=> this.onConnect(conn));
	}

	/**
	 * Broadcast a message to all pears
	 * @param msg
	 */
	public broadcast(msg:{action:string, data?:any}, exceptUsers?:UserData[]) {
		if(this._DISABLED) return;
		let exceptUids:string[] = exceptUsers? exceptUsers.map((v)=> v.id.toString()) : [];
		// Logger.info("BROADCAST to "+this._connections.length+" users : ", msg.action);
		for (let i = 0; i < this._connections.length; ++i) {
			let allow = true;
			if(exceptUids && exceptUids.length > 0)  {
				for (let k = 0; k < exceptUids.length; k++) {
					const uid = exceptUids[k];
					if(!this._uidToConnection[uid]) continue;
					if(this._uidToConnection[uid] == this._connections[i]) {
						allow = false;
					}
				}
			}
			if(allow) {
				this._connections[i].write(JSON.stringify(msg));
			}
		}
	}

	/**
	 * Sends a message to one specific user
	 */
	public sendTo(user:UserData, msg:{action:string, data?:any}):void {
		let conn = this._uidToConnection[user.id.toString()];
		// console.log("send to ", user.name, msg);
		if(!conn) {
			Logger.error("Actually nope... connexion not found for ", user.name, ":(");
			return;
		}
		conn.write(JSON.stringify(msg));
	}

	/**
	 * Sends a message to a specific users list
	 */
	public sendToUserList(users:UserData[], msg:{action:string, data?:any}):void {
		for (let i = 0; i < users.length; i++) {
			this.sendTo(users[0], msg);
		}
	}

	/**
	 * Connects express to socket
	 * @param server
	 * @param scope
	 */
	public installHandler(server, scope : ServerOptions) {
		if(this._DISABLED) return;
		this.connect();
		this._sockjs.installHandlers(server, scope);
	}

	/**
	 * Updates a users' group
	 */
	public addToGroup(groupId:string, user:UserData):void {
		Logger.log("Add user "+LogStyle.BgWhite+LogStyle.FgBlue+user.name+LogStyle.Reset+" to group "+groupId);
		if(!this._groupIdToUsers[groupId]) {
			this._groupIdToUsers[groupId] = [];
		}

		if(this._userIdToGroupId[user.id] != groupId) {
			//if user still on another group, remove it from taht group
			this.removeUserFromGroup(user.id, this._userIdToGroupId[user.id]);
		}
		

		this._groupIdToUsers[groupId].push(user);
		let users = this._groupIdToUsers[groupId];
		for (let i = 0; i < users.length; i++) {
			this._userIdToGroupId[users[i].id] = groupId;
		}
		// console.log(this._groupIdToUsers[groupId])
	}

	/**
	 * Sends a message to a specific users group
	 */
	public sendToGroup(groupId:string, msg:{action:string, data?:any}, exceptUserID?:string):void {
		// Logger.info("Send to group ", groupId, msg.action);
		let users = this._groupIdToUsers[groupId];
		if(!users) return;
		for (let i = 0; i < users.length; i++) {
			if(exceptUserID && users[i].id == exceptUserID || users[i].offline) continue;
			this.sendTo(users[i], msg);
		}
	}


	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		if(this._DISABLED) return;
		this._connections = [];
		this._uidToConnection = {};
		this._connectionToUid = {};
	}

	private onConnect(conn:Connection):void {
		if(this._DISABLED) return;
		this._connections.push(conn);

		// Logger.info("Socket connexion opened : "+LogStyle.Reset+conn.id);
		conn.on("data", (message) => {
			let json:{action:string, data:any, includeSelf?:boolean, from?:string} = JSON.parse(message);
			if(json.action == SOCK_ACTIONS.PING) {
				//Don't care, just sent to check if connection's style alive
				return;
			}else if(json.action == SOCK_ACTIONS.DEFINE_UID) {
				Logger.warn("Sock Register", json.data.name);
				//Associate socket connection to user
				this._uidToConnection[json.data.id] = conn;
				this._connectionToUid[conn.id] = json.data.id;
				return;
			}else{
				if(this._DISABLED) return;
				let uid = this._connectionToUid[ conn.id ];
				let group = this._userIdToGroupId[ uid ];

				//User left room, cleanup its references
				if(json.action == SOCK_ACTIONS.LEAVE_ROOM) {
					Logger.simpleLog("Leave room", uid, "from", json.data.groupId);
					// this.onClose(conn);
					this.removeUserFromGroup(uid, json.data.groupId);
				}else
				if(uid && group) {
					//Message is sent by a valid user on a valid room.
					let exclude = uid;
					if(json.includeSelf === true) exclude = null;
					json.from = uid;
					// Logger.info("Socket message : "+LogStyle.Reset+json.action, "for group", group, "excluding", exclude);
					// console.log(json);
					// Logger.simpleLog("uid:"+uid+"    group:"+group);
					this.sendToGroup(group, json, exclude);
				}

				if(json.action == SOCK_ACTIONS.UPDATE_HANDICAP || json.action == SOCK_ACTIONS.UPDATE_USERNAME) {
					if(this.onUpdateUser) this.onUpdateUser(json.data.user, json.data.groupId);
				}

			}
		});
		conn.on("close", (p) => {
			this.onClose(conn);
			let uid = this._connectionToUid[ conn.id ];
			if(uid) {
				this.removeUserFromGroup(uid);
			}
		});
	}

	private onClose(conn:Connection):void {
		if(this._DISABLED) return;
		conn.close();
		// Logger.info("Socket connexion closed : "+LogStyle.Reset+conn.id);
		//Cleanup user's connection from memory
		let idx = this._connections.indexOf(conn);
		if(idx) {
			delete this._connectionToUid[conn.id];
			this._connections.splice(idx, 1);
		}
	}

	private removeUserFromGroup(uid:string, groupId?:string):void {
		delete this._uidToConnection[uid];
		if(!groupId) groupId = this._userIdToGroupId[uid];
		let userList = this._groupIdToUsers[groupId];
		if(userList) {
			let user:UserData;
			for (let i = 0; i < userList.length; i++) {
				if(userList[i].id == uid) {
					user = userList[i]
					Logger.warn("Unregister ", user.name, "from group", groupId);
					userList.splice(i, 1);
					this.onUserDisconnect(groupId, user);
				}
			}
			if(user) {
				this.sendToGroup(groupId, {action:SOCK_ACTIONS.LEAVE_ROOM, data:{user}}, user.id);
			}
		}
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
	PLAYER_PASS="PLAYER_PASS",
	UPDATE_HANDICAP="UPDATE_HANDICAP",
	UPDATE_USERNAME="UPDATE_USERNAME",
	CHAT_MESSAGE="CHAT_MESSAGE",
};