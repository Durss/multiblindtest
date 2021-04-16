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
	guessedBy?:UserData;//For multiplayer mode
	loadFail?:boolean;
	highlight?:boolean;//Used in twitch mode when replaying one specific song to highlight it on the stream
}