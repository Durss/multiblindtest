import * as bodyParser from "body-parser";
import * as express from "express";
import { NextFunction, Request, Response, Express } from "express-serve-static-core";
import * as http from "http";
import Config from '../utils/Config';
import Logger from '../utils/Logger';
import * as historyApiFallback from 'connect-history-api-fallback';
import SocketServer, { SOCK_ACTIONS } from "./SocketServer";
import { v4 as uuidv4 } from 'uuid';
import RoomData from "../vo/RoomData";
import UserData from "../vo/UserData";
import TrackData from "../vo/TrackData";
import TwitchEBS from "../controllers/TwitchEBS";

export default class HTTPServer {

	private app:Express;

	private _rooms:{[id:string]:RoomData} = {};

	constructor(public port:number) {
		this.app = <Express>express();
		let server = http.createServer(<any>this.app);

		SocketServer.instance.onUpdateUser = (user:UserData, roomId:string) => {
			let room = this._rooms[roomId];
			// console.log("Update user", user.name, "on room", roomId);
			if(!room) return;
			for (let i = 0; i < room.users.length; i++) {
				const u = room.users[i];
				if(u.id == user.id) {
					room.users[i] = user;
				}
			}
		};

		SocketServer.instance.onUserDisconnect = (roomId:string, user:UserData) => {
			// Logger.log("Remove user", user.name, "from room", roomId)
			if(!this._rooms[roomId]) {
				Logger.error("onUserDisconnect : Room not found")
				return;
			}
			let allOffline = true;
			for (let i = 0; i < this._rooms[roomId].users.length; i++) {
				if(this._rooms[roomId].users[i].id == user.id) {
					this._rooms[roomId].users[i].offline = true;
					// this._rooms[roomId].users.splice(i, 1);
				}
				if(!this._rooms[roomId].users[i].offline) {
					allOffline = false;
				}
			}
			if(this._rooms[roomId].users.length == 0 || allOffline) {
				Logger.warn("Room empty, delete it ", roomId);
				delete this._rooms[roomId];
			}
		}
		SocketServer.instance.installHandler(server, {prefix:"/sock"});

		server.listen(Config.SERVER_PORT, '0.0.0.0', null, ()=> {
			Logger.success("Server ready on port " + Config.SERVER_PORT + " :: server name \"" + Config.SERVER_NAME + "\"");
		});

		this.app.use(historyApiFallback({
			index:'/'+Config.SERVER_NAME+"/index.html",
			//@ts-ignore
			publicPath: Config.PUBLIC_PATH,
			// verbose:true,
			rewrites: [
				{
					//Avoiding rewrites for API calls and socket
					from: /.*\/(api|sock)\/?.*$/,
					to: (context) => {
						return context.parsedUrl.pathname;
					}
				}
			],
		}));
		
		this.prepareApp();
	}

	protected initError(error: any): void {
		Logger.error("Error happened !", error);
	}

	protected prepareApp(): void {

		this.app.use(<any>bodyParser.urlencoded({ extended: true }));
		this.app.use(<any>bodyParser.json({limit: '10mb'}));

		this.app.all(Config.SERVER_NAME+"/*", (req:Request, res:Response, next:NextFunction) => {
			// Set CORS headers
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
			res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,X-AUTH-TOKEN');
			res.header("Access-Control-Allow-Origin", "*");
			if (req.method == 'OPTIONS') {
				res.status(200).end();
				return;
			}
			
			next();
		});
		
		this.app.get("/api", (req, res) => {
			res.status(200).send(JSON.stringify({success:true}));
		});
		
		this.createEndpoints();
		TwitchEBS.instance.initialize();
		
		let staticHandler:any = express.static( Config.PUBLIC_PATH );
		this.app.use(Config.SERVER_NAME+"/", staticHandler);//static files
		
		this.app.use((error : any, request : Request, result : Response, next : NextFunction) => {
			this.errorHandler(error , request, result, next)
		});

	}
	
	/**
	 * Create public endpoints
	 */
	protected createEndpoints():void {
		/**
		 * Get existing group's details
		 */
		this.app.get("/api/group/details", (req, res) => {
			if(!req.query.roomId) {
				res.status(500).send(JSON.stringify({success:false, error:"MISSING_ROOM_ID", message:"Room ID missing from query"}));
				return;
			}
			
			let room = this._rooms[(<string>req.query.roomId).toLowerCase()];
			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			if(req.query.user) {
				for (let i = 0; i < room.users.length; i++) {
					const u = room.users[i];
					if(u.id == req.query.user) {
						u.offline = false;
					}
				}
			}
			res.status(200).send(JSON.stringify({success:true, room}));
		});

		/**
		 * Create new group
		 */
		this.app.post("/api/group/create", (req, res) => {
			let roomId = uuidv4();
			this._rooms[roomId] = {
				id:roomId,
				creator: null,
				users: [],
				playlists : req.body.playlists,
				tracksCount : req.body.tracksCounts,
				gamesCount : 3,
				gameStepIndex : 0,
				expertMode: null,
				scoreHistory: [],
			}
			res.status(200).send(JSON.stringify({success:true, roomId}));
		});

		/**
		 * Updates an existing
		 */
		this.app.post("/api/group/update", (req, res) => {
			let room = req.body.room;
			this._rooms[room.id] = room;
			res.status(200).send(JSON.stringify({success:true, room}));
		});

		/**
		 * Resets an existing group
		 */
		this.app.post("/api/group/restart", (req, res) => {
			let roomId = req.body.roomId;
			let room = this._rooms[roomId];
			if(room) {
				room.gameStepIndex = 0;
				room.scoreHistory = [];
				room.currentTracks = null;
			}
			res.status(200).send(JSON.stringify({success:true, room}));
		});
		
		/**
		 * Join an existing group
		 */
		this.app.post("/api/group/join", (req, res) => {
			let roomId = req.body.roomId;
			let room = this._rooms[roomId];
			let me:UserData;
			let user = req.body.user;
			if(user) {
				me = user;
			}else{
				let username = req.body.username;
				me = {
					id: uuidv4(),
					score :0,
					offline: false,
					handicap: 0,
					name: username.substr(0, 50),
				};
			}

			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			
			me.offline = false;
			if(room.users.length == 0) {
				room.creator = me.id;
			}

			let exists = false;
			for (let i = 0; i < room.users.length; i++) {
				const u = room.users[i];
				if(u.id == me.id) {
					u.offline = false;
					if(!u.handicap) u.handicap = 0;
					me.offline = u.offline;
					me.handicap = u.handicap;
					exists = true;
				}
			}
			if(!exists) {
				//User not part of room
				me.score = 0;//Reset score
				me.handicap = 0;//Reset handicap
				room.users.push(me);
			}
			SocketServer.instance.addToGroup(roomId, me);
			
			res.status(200).send(JSON.stringify({success:true, room, me}));
		});

		/**
		 * Define current tracks of the group
		 */
		this.app.post("/api/group/setTracks", (req, res) => {
			let roomId = req.body.roomId;
			let room = this._rooms[roomId];
			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			//Reset pass states
			for (let i = 0; i < room.users.length; i++) {
				room.users[i].pass = false;
			}
			room.currentTracks = req.body.tracks;
			room.gameStepIndex ++;
			res.status(200).send(JSON.stringify({success:true, roomId}));
			SocketServer.instance.sendToGroup(roomId, {action:SOCK_ACTIONS.TRACKS_DATA, data:room});
		});

		/**
		 * Called when someone guessed a track
		 */
		this.app.post("/api/group/guessed", (req, res) => {
			let roomId = req.body.roomId;
			let trackId = req.body.trackId;
			let uid = req.body.user;
			let room = this._rooms[roomId];
			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			let score = room.currentTracks.length;
			let user:UserData;
			for (let i = 0; i < room.currentTracks.length; i++) {
				const t:TrackData = room.currentTracks[i];
				if(t.id == trackId && !t.guessedBy) {
					user = room.users.find(u => u.id == uid);
					t.guessedBy = user;
					t.enabled = true;
				}else if(t.enabled) {
					score --;
				}
			}
			if(user) {
				user.score += score;
			}

			room.scoreHistory.push({
				score,
				trackId,
				guesserId:uid,
			})

			res.status(200).send(JSON.stringify({success:true, room}));
			SocketServer.instance.sendToGroup(roomId, {action:SOCK_ACTIONS.GUESSED_TRACK, data:{room, score}});
		});

		/**
		 * Called if a user passes
		 */
		this.app.post("/api/group/pass", (req, res) => {
			let roomId = req.body.roomId;
			let userId = req.body.userId;
			let room = this._rooms[roomId];
			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			let passCount = 0;
			let usersOnline = 0;
			for (let i = 0; i < room.users.length; i++) {
				let u = room.users[i];
				if(u.id == userId) u.pass = true;
				if(u.pass) passCount ++;
				if(!u.offline) usersOnline ++;
			}

			let pass = passCount > usersOnline/2;
			if(pass) {
				//Flag all tracks as discovered
				for (let i = 0; i < room.currentTracks.length; i++) {
					let t = room.currentTracks[i];
					t.enabled = true;
				}
			}
			res.status(200).send(JSON.stringify({success:true, room, pass}));
			SocketServer.instance.sendToGroup(roomId, {action:SOCK_ACTIONS.PLAYER_PASS, data:{room, pass}});
		});

		/**
		 * Called to kick a user out of the game
		 */
		this.app.post("/api/group/kick", (req, res) => {
			let roomId = req.body.roomId;
			let userId = req.body.userId;
			let room = this._rooms[roomId];
			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}

			console.log("Kick", userId)
			for (let i = 0; i < room.users.length; i++) {
				const u = room.users[i];
				if(u.id == userId) {
					room.users.splice(i, 1);
					if(u.id == room.creator && room.users.length > 0) {
						//define new host
						room.creator = room.users[0].id;
					}
				}
			}
			res.status(200).send(JSON.stringify({success:true, room}));
			SocketServer.instance.sendToGroup(roomId, {action:SOCK_ACTIONS.PLAYER_KICKED, data:{room, userId}});
		});

		/**
		 * Broadcast to twitch plugin
		 */
		this.app.post("/api/twitch/broadcast", async (req, res) => {
			let message = req.body.message;
			let token = req.body.token;
			let infos = await TwitchEBS.instance.validateToken(token);
			// console.log("Get channel for user ", infos.user_id);
			// let channel = await TwitchEBS.instance.getChannelInfo(infos.user_id);
			// console.log(channel);
			TwitchEBS.instance.broadcast(infos.user_id, message);
			res.status(200).send(JSON.stringify({success:true}));
		});

		/**
		 * Send message to chat
		 */
		this.app.post("/api/twitch/sendToChat", async (req, res) => {
			let message = req.body.message;
			let channel = req.body.channel;
			let token = req.body.token;
			TwitchEBS.instance.sendToChat(channel, message, token);
			res.status(200).send(JSON.stringify({success:true}));
		});

		/**
		 * Gets a user infos from its token
		 */
		this.app.post("/api/twitch/user", async (req, res) => {
			let token = req.body.token;
			let user = await TwitchEBS.instance.validateToken(token);
			res.status(200).send(JSON.stringify({success:true, user}));
		});
	}


	protected errorHandler(error: any, req: Request, res: Response, next: NextFunction): any {
		Logger.error("Express error");
		console.log(error)
	}
}