import { Event } from '@/utils/EventDispatcher';
import { SOCK_ACTIONS } from '@/sock/SockController';

export default class SocketEvent  extends Event {
	

	private _data:any;

	constructor(type:SOCK_ACTIONS, data:any) {
		super(type, null);
		this._data = data;
	}



	/********************
	 * GETTER / SETTERS *
	 ********************/
	public get data():any { return this._data; }



	/******************
	 * PUBLIC METHODS *
	 ******************/



	/*******************
	 * PRIVATE METHODS *
	 *******************/
}