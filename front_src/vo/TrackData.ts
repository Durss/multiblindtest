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
 }