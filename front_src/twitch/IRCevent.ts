import { Event } from '@/utils/EventDispatcher';
import {IRCTypes} from './IRCClient';

/**
* Created : 07/12/2020 
*/
export default class IRCEvent extends Event {

	public static MESSAGE:string = "MESSAGE";
	
	constructor(type:string, public message:any, public tags:IRCTypes.Tag, public channel:string, public self:boolean) {
		super(type, null);
	}
	
}