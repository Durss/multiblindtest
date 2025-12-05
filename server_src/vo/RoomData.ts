import UserData from "./UserData";
import PlaylistData from "./PlaylistData";
import TrackData from "./TrackData";

export default interface RoomData {
    id:string;
    creator:string|null;
    users:UserData[];
    playlists:PlaylistData[];
    tracksCount:number;
    gamesCount:number;
    gameStepIndex:number;
    currentTracks?:TrackData[];
    expertMode:string[]|null;
    scoreHistory:{trackId:string, guesserId:string, score:number}[];
}