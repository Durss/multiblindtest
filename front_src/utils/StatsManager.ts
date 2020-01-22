import ua from 'universal-analytics';
import Config from './Config';

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
		this._visitor = ua(Config.UA);
	}
}