import UserData from "./UserData";
import PlaylistData from "./PlaylistData";
import TrackData from "./TrackData";

export default interface RoomData {
    id:string;
    creator:string;
    users:UserData[];
    playlists:PlaylistData[];
    tracksCount:number;
    currentTracks?:TrackData[];
    // guessesTrackIdToUserId?:{[id:string]:string};
}