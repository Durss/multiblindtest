import UserData from './UserData';

export default interface TrackData {
	id: string;
	name: string;
	artist: string;
	album: string;
	audioPath: string;
	enabled?:boolean;
	isPlaying?:boolean;
	picture?:string;
	guessedBy?:UserData[];//For multiplayer mode
	loadFail?:boolean;
	pendingAcceptation?:boolean;//Used for twitch mode when "multiple winners" is enabled
	highlight?:boolean;//Used in twitch mode when replaying one specific song to highlight it on the stream
	score?:number//Used to make track scoring easier to manage
}