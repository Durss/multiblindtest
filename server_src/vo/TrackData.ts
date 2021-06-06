import UserData from "./UserData";

export default interface TrackData {
	id: string;
	name: string;
	artist: string;
	audioPath: string;
	enabled?:boolean;
	isPlaying?:boolean;
	picture?:string;
	guessedBy?:UserData;
	score?:number;
}