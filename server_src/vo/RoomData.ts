import UserData from "./UserData";
import PlaylistData from "./PlaylistData";

export default interface RoomData {
    id:string;
    creator:string;
    users:UserData[];
    playlists:PlaylistData[];
    tracksCount:number;
}