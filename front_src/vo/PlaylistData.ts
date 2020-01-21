import TrackData from './TrackData';

export default interface PlaylistData {
	id: string;
	name: string;
	cover: string;
	owner: string;
	tracks: TrackData[];
 }