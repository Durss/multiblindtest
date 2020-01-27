import ua from 'universal-analytics';
import Config from './Config';
import * as uuidv4 from 'uuid/v4';

export default class StatsManager {

	private static _instance: StatsManager;

	private _visitor: ua.Visitor;

	constructor() {
		this.initialize();
	}



	/********************
	 * GETTER / SETTERS *
	 ********************/

	/**
	 * Gets the singleton's reference
	 */
	public static get instance(): StatsManager {
		if (!this._instance) this._instance = new StatsManager();
		return this._instance;
	}

	/**
	 * Gets the singleton's reference
	 */
	public set clientId(value:string) {
		localStorage.setItem("uid", value);
		this._visitor.set("uid", value);
		console.log("OK", value)
	}



	/******************
	 * PUBLIC METHODS *
	 ******************/
	/**
	 * Sends a pageview3
	 * 
	 * @param path path
	 * @param title page title
	 */
	public pageView(path: string, title?: string): void {
		let data: any = {};
		data.dp = path
		if (title) data.dt = title;
		this._visitor.pageview(data).send();
	}

	/**
	 * Sends an event
	 * 
	 * @param cat category
	 * @param act action
	 * @param label label
	 * @param value value
	 * @param path path
	 */
	public event(cat: string, act:string, label?:string, value?:any, path?:string): void {
		let data: any = {};
		data.ec = cat;
		data.ea = act;
		data.el = label;
		data.ev = value;
		data.dp = path;
		this._visitor.event(data).send();
	}



	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize(): void {
		let cid = uuidv4();
		if(!localStorage.getItem("cid")) {
			localStorage.setItem("cid", cid);
		}else{
			cid = localStorage.getItem("cid");
		}

		this._visitor = ua(Config.UA, cid);

		if(localStorage.getItem("uid")) {
			this.clientId = localStorage.getItem("uid");
		}
	}
}