/**
 * Fallback to sessionStorage if localStorage isn't available
 * Created : 18/10/2020 
 */
export default class Store {

	private static store:Storage;
	
	constructor() {
	
	}
	
	/********************
	* GETTER / SETTERS *
	********************/
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	public static get(key:string):string {
		if(!this.store) this.init();
		return this.store.getItem(key);
	}
	public static set(key:string, value:string):void {
		if(!this.store) this.init();
		this.store.setItem(key, value);
	}
	public static remove(key:string):void {
		if(!this.store) this.init();
		this.store.removeItem(key);
	}
	public static clear():void {
		if(!this.store) this.init();
		this.store.clear();
	}
	
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/
	private static init():void {
		this.store = localStorage? localStorage : sessionStorage;
	}
}