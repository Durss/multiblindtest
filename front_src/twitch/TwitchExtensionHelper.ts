import TwitchExtensionEvent from "@/twitch/TwitchExtensionEvent";
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

		this._twitch.onContext((context) => {
			this.log('On Context');
			this.log(context);
			this._context = context;
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.MESSAGE, context));
		});

		this._twitch.onAuthorized((auth) => {
			// save our credentials
			this._token = auth.token;
			this._userId = auth.userId;
			this._channelId = auth.channelId;
			this._isBroadcaster = this._userId.indexOf(this._channelId) > -1;
			this._connected = true;
			this.log('On authorized !');
			this.log(auth);
			this._auth = auth;
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.AUTHORIZED, auth));
			if(this._onConnect) {
				this._onConnect();
			}
		});

		// listen for incoming broadcast message from our EBS
		this._twitch.listen('broadcast', (target, contentType, message) => {
			this.log('Received a broadcast message:');
			this.log(message);
			this.dispatchEvent(new TwitchExtensionEvent(TwitchExtensionEvent.MESSAGE, message));
		});
	}

	public log(message:string):void {
		this._twitch.rig.log(message);
		console.log(message);
	}

	public onConnect():Promise<void> {
		return new Promise((resolve, reject) => {
			if(this.connected) {
				resolve();
				return;
			}else{
				this._onConnect = resolve;
			}
		})
	}
	
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/
}