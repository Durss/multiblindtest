<template>
	<div class="groupgame">
		<GameView v-if="tracksToPlay && tracksToPlay.length > 0" :rawTracksData="tracksToPlay" :trackscounts="tracksToPlay.length" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import GameView from './GameView.vue';
import RoomData from '../vo/RoomData';
import Utils from '../utils/Utils';
import Api from '../utils/Api';
import TrackData from '../vo/TrackData';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import SocketEvent from '../vo/SocketEvent';

@Component({
	components:{
		GameView
	}
})
export default class GroupGame extends Vue {

	@Prop()
	public id:string;

	public tracksIds:string = null;
	public tracksToPlay:TrackData[] = [];
	public room:RoomData = null;

	public tracksDataHandler:any;

	public mounted():void {
		this.tracksDataHandler = (e) => this.onTracksData(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);

		this.pickRandomTracks();
	}

	public beforeDestroy():void {
		SockController.instance.removeEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
	}

	public async pickRandomTracks():Promise<void> {
		this.room = this.$store.state.groupRoomData;
		//Room info not found on storage. User probably reloaded the page
		if(!this.room) {
			//Load it from server based on ID on URL
			try {
				let res = await Api.get("group/details", {roomId:this.id});
				this.room = res.room;
			}catch(error) {
				//room does not exists
				this.$store.dispatch("alert", error.message);

				if(this.$store.state.loggedin) {
					this.$router.push({name:"playlists"});
				}else{
					this.$router.push({name:"home"});
				}
				return;
			}
		}

		let playlistIds = this.room.playlists.map(p => p.id);
		let playlists = this.$store.state.playlistsCache;
		let selectedPlaylists = [];
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
			if(playlistIds.indexOf(p.id) > -1) {
				selectedPlaylists.push(p);
			}
		}
		
		let tracks = [];
		for (let i = 0; i < selectedPlaylists.length; i++) {
			const p = selectedPlaylists[i];
			tracks = tracks.concat(p.tracks);
		}

		tracks = Utils.shuffle(tracks);
		let toPlay:TrackData[] = [];
		for (let i = 0; i < Math.min(6, Math.max(1, this.room.tracksCount)); i++) {
			let t = tracks[i];
			if(!t.audioPath) {
				i--;
				continue;
			}
			toPlay.push(t);
		}

		SockController.instance.sendMessage({action:SOCK_ACTIONS.TRACKS_DATA, data:toPlay, includeSelf:true});
	}

	private onTracksData(event:SocketEvent):void {
		console.log("START !!!", event.data);
		this.tracksToPlay = event.data;
	}

}
</script>

<style scoped lang="less">
.groupgame{
	
}
</style>