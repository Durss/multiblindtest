import store from "@/store";
import TwitchExtensionEvent from "@/twitch/TwitchExtensionEvent";
import Api from "@/utils/Api";
import { EventDispatcher } from "@/utils/EventDispatcher";

/**
* Created : 24/01/2021 
*/
export default class TwitchExtensionHelper extends EventDispatcher {

	private static _instance:TwitchExtensionHelper;
	private _twitch:any;
	private _token:string;
	private _userId:string;
	private _channelId:string;
	private _connected:boolean;
	private _isBroadcaster:boolean;
	private _context:any;
	private _auth:any;
	private _onConnect:any;
	private _lastdata:any;
	private _broadcastInterval:any;
	
	constructor() {
		super();
	}
	
	/********************
	* GETTER / SETTERS *
	********************/
	static get instance():TwitchExtensionHelper {
		if(!TwitchExtensionHelper._instance) {
			TwitchExtensionHelper._instance = new TwitchExtensionHelper();
		}
		return TwitchExtensionHelper._instance;
	}

	public get connected():boolean { return this._connected; }
	public get isBroadcaster():boolean { return this._isBroadcaster; }
	public get context():boolean { return this._context; }
	public get auth():boolean { return this._auth; }
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	public initialize():void {
		//@ts-ignore
		this._twitch = window.Twitch.ext;

		this.log("TEH : Initialize()")

		this._twitch.onContext((context) => {
			this.log('TEH : onContext()');
			this.log(context);
			this._context = context;
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.MESSAGE, context));
		});

		this._twitch.onAuthorized((auth) => {
			this.log('TEH : onAuthorized()');
			this.log(auth);
			// save our credentials
			this._token = auth.token;
			this._userId = auth.userId;
			this._channelId = auth.channelId;
			this._isBroadcaster = this._userId.indexOf(this._channelId) > -1;
			this._connected = true;
			this._auth = auth;
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.AUTHORIZED, auth));
			if(this._onConnect) {
				this._onConnect();
			}
		});

		// listen for incoming broadcast message from our EBS
		this._twitch.listen('broadcast', (target, contentType, message) => {
			this.log('TEH : broadcast message received');
			this.log(message);
			let json;
			try {
				json = JSON.parse(message);
			}catch(e) {
				//Ignore message if cannot be decoded :(
				return;
			}
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.MESSAGE, json));
		});
	}

	public log(message:string):void {
		if(this._twitch && this._twitch.rig) {
			this._twitch.rig.log(message);
		}else{
			console.log(message);
		}
	}
	
	public onConnect():Promise<void> {
		return new Promise((resolve, reject) => {
			this.log("TEH : onConnect "+ this.connected);
			if(this.connected) {
				resolve();
				return;
			}else{
				this._onConnect = resolve;
			}
		})
	}

	/**
	 * Broadcast to all connected users.
	 * Only the broadcaster can use it.
	 * 
	 * @param type 
	 * @param data 
	 */
	public broadcast(type:string, data:any):void {
		if(!store.state.twitchOAuthToken) {
			console.error("Cannot broadcast to clients if not authenticated");
			return;
		}
		data.type = type;
		this._lastdata = data;
		this.broadcastLastMessage();

		//Regularly broadcast the last message so new users are un sync
		clearInterval(this._broadcastInterval);
		this._broadcastInterval = setInterval(_=> this.broadcastLastMessage(), 5000);
	}
	
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/

	private broadcastLastMessage():void {
		if(!this._lastdata || !store.state.twitchOAuthToken) return;
		Api.post("twitch/broadcast", {token:store.state.twitchOAuthToken, message:JSON.stringify(this._lastdata)});
	}
}