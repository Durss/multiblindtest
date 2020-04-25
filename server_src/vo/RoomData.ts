import UserData from "./UserData";
import PlaylistData from "./PlaylistData";
import TrackData from "./TrackData";

export default interface RoomData {
    id:string;
    creator:string;
    users:UserData[];
    playlists:PlaylistData[];
    tracksCount:number;
    gamesCount:number;
    gameStepIndex:number;
    currentTracks?:TrackData[];
    expertMode:string[];
}