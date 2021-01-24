import { Event } from '@/utils/EventDispatcher';

/**
* Created : 07/12/2020 
*/
export default class TwitchExtensionEvent extends Event {

	public static MESSAGE:string = "MESSAGE";
	public static AUTHORIZED:string = "AUTHORIZED";
	public static CONTEXT:string = "CONTEXT";
	
	constructor(type:string, public data:any) {
		super(type, null);
	}
	
}