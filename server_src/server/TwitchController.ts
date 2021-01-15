/**
* Created : 01/01/2021 
*/
export default class TwitchController {

	private static _instance:TwitchController;
	
	constructor() {
	
	}
	
	/********************
	* GETTER / SETTERS *
	********************/
	static get instance():TwitchController {
		if(!TwitchController._instance) {
			TwitchController._instance = new TwitchController();
		}
		return TwitchController._instance;
	}
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	public initialize():void {
		
	}
	
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/
}