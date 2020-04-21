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

export default class HTTPServer {

	private app:Express;

	private _rooms:{[id:string]:RoomData} = {};

	constructor(public port:number) {
		this.app = <Express>express();
		let server = http.createServer(<any>this.app);


		SocketServer.instance.onDeleteUser = (roomId:string, user:UserData) => {
			Logger.log("Remove user", user.name, "from room", roomId)
			if(!this._rooms[roomId]) {
				Logger.error("Room not found")
				return;
			}
			for (let i = 0; i < this._rooms[roomId].users.length; i++) {
				if(this._rooms[roomId].users[i].id == user.id) {
					this._rooms[roomId].users.splice(i, 1);
				}
			}
			if(this._rooms[roomId].users.length == 0) {
				Logger.log("Room empty, delete it ", roomId);
				delete this._rooms[roomId];
			}
		}
		SocketServer.instance.installHandler(server, {prefix:"/sock"});

		server.listen(Config.SERVER_PORT, '0.0.0.0', null, ()=> {
			Logger.success("Server ready on port " + Config.SERVER_PORT + " :: server name \"" + Config.SERVER_NAME + "\"");
		});

		this.app.use(historyApiFallback({
			index:'/'+Config.SERVER_NAME+"/index.html",
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
		
		this.doPrepareApp();
	}

	protected initError(error: any): void {
		Logger.error("Error happened !", error);
	}

	protected doPrepareApp(): void {

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
			Logger.info("GET test");
			res.status(200).send(JSON.stringify({success:true}));
		});
		
		this.createEndpoints();
		
		let publicFolder = Config.PUBLIC_PATH;
		this.app.use(Config.SERVER_NAME+"/", express.static(publicFolder));//static files
		
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
			}
			res.status(200).send(JSON.stringify({success:true, roomId}));
		});
		
		/**
		 * Join an existing group
		 */
		this.app.post("/api/group/join", (req, res) => {
			let roomId = req.body.roomId;
			let room = this._rooms[roomId];
			let me;
			let user = req.body.user;
			if(user) {
				me = user;
			}else{
				let username = req.body.username;
				me = {
					id: uuidv4(),
					name: username.substr(0, 50),
				};
			}

			if(!room) {
				res.status(500).send(JSON.stringify({success:false, error:"ROOM_NOT_FOUND", message:"Room not found"}));
				return;
			}
			
			if(room.users.length == 0) {
				room.creator = me.id;
			}
			let exists = room.users.map((e) => { return e.id; }).indexOf(me.id) != -1;
			if(!exists) {
				room.users.push(me);
				SocketServer.instance.addToGroup(roomId, me);
			}
			
			res.status(200).send(JSON.stringify({success:true, room, me}));
		});
	}


	protected errorHandler(error: any, req: Request, res: Response, next: NextFunction): any {
		Logger.error("Express error");
		console.log(error)
	}

	private onReady(): void {
		
	}
}