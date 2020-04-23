<template>
	<div class="groupgame">
		<img src="@/assets/loader/loader.svg" alt="loader" v-if="loading">
		<div v-if="room">
			<GameView
				v-if="tracksToPlay && tracksToPlay.length > 0"
				:rawTracksData="tracksToPlay"
				:trackscounts="tracksToPlay.length"
				@guessed="onTrackFound"
				ref="game"
			/>

			<div class="players">
				<div v-for="u in room.users" :key="u.id" :class="userClasses(u)">
					<div class="username">{{u.name}}</div>
					<div class="score">{{u.score}}</div>
				</div>
			</div>

			<div v-if="gameComplete" class="complete">
				<div class="title">⭐ Complete ⭐</div>
				<div v-if="isHost">
					<Button title="Next game" @click="pickRandomTracks()" />
				</div>
				<div v-if="!isHost" class="wait">
					<img src="@/assets/loader/loader.svg" alt="loading">
					<div>Wait for {{creatorName}} to start next game...</div>
				</div>
			</div>
		</div>
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
import UserData from '../vo/UserData';
import Button from '../components/Button.vue';

@Component({
	components:{
		Button,
		GameView,
	}
})
export default class GroupGame extends Vue {

	@Prop()
	public id:string;

	public tracksIds:string = null;
	public tracksToPlay:TrackData[] = [];
	public room:RoomData = null;
	public loading:boolean = false;
	public gameComplete:boolean = false;
	public me:UserData = null;

	public tracksDataHandler:any;
	public guessedTrackHandler:any;

	public get isHost():boolean { return this.me.id == this.room.creator; }

	public get creatorName():string {
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.creator == this.room.users[i].id) {
				return this.room.users[i].name;
			}
		}
		return null;
	}

	public async mounted():Promise<void> {
		this.tracksDataHandler = (e) => this.onTracksData(e);
		this.guessedTrackHandler = (e) => this.onGuessedTrack(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.GUESSED_TRACK, this.guessedTrackHandler);
		this.me = this.$store.state.userGroupData;
		
		await this.getRoomDetails();
		if(!this.room) return;

		if(this.room.currentTracks) {
			//If there are tracks it's because the game is already started
			//don't wait for socket event and just start it
			this.tracksToPlay = this.room.currentTracks;
			this.loading = false;
			this.checkComplete();
		}else if(this.room.creator == this.me.id) {
			this.pickRandomTracks();
		}
	}

	public beforeDestroy():void {
		SockController.instance.removeEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.GUESSED_TRACK, this.guessedTrackHandler);
	}

	public userClasses(u:UserData):string[] {
		let res = ["player"];
		if(u.id == this.me.id) res.push("me");
		if(u.id == this.room.creator) res.push("host");
		return res;
	}

	/**
	 * Select tracks to be played
	 */
	public pickRandomTracks():void {
		this.loading = true;
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

		console.log(toPlay.map(t => t.name));

		Api.post("group/setTracks", {roomId:this.room.id, tracks:toPlay});
	}

	/**
	 * Loads up room's details
	 */
	private async getRoomDetails():Promise<void> {
		this.room = this.$store.state.groupRoomData;
		//Room info not found on storage. User probably reloaded the page
		if(!this.room) {
			//Load it from server based on ID on URL
			try {
				let res = await Api.get("group/details", {roomId:this.id, user:this.me.id});
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
			await this.joinRoom();
		}
	}

	/**
	 * Join a room
	 */
	private async joinRoom():Promise<void> {
		let data:any = {
				user: this.me,
				roomId:this.room.id
			};
		let res = await Api.post("group/join", data);
	}

	/**
	 * Called when finding a track
	 */
	private onTrackFound(track:TrackData):void {
		Api.post("group/guessed", {roomId:this.room.id, user:this.me.id, trackId:track.id});
	}

	/**
	 * Called when host sends tracks to be played
	 */
	private onTracksData(event:SocketEvent):void {
		console.log("TRACKS DATA", event.data);
		this.loading = false;
		this.room = event.data;
		this.gameComplete = false;
		this.tracksToPlay = this.room.currentTracks;
	}

	/**
	 * Called when a player found a track
	 */
	private onGuessedTrack(event:SocketEvent):void {
		let room:RoomData = event.data.room;
		let score:number = event.data.score;
		let allGuessed = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const track = this.tracksToPlay[i];
			let t = room.currentTracks.find(t => t.id == track.id);
			if(t.guessedBy) {
				// track.guessedBy = t.guessedBy
				if(!track.guessedBy) {
					Vue.set(track, "guessedBy", t.guessedBy);
					track.enabled = true;
				}
			}else{
				allGuessed = false;
			}
		}
		this.gameComplete = allGuessed;
		// this.gameComplete = true;//TODO REMOVE
		Vue.set(this.room, "users", room.users);
	}

	public checkComplete():void {
		let complete = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			if(!this.tracksToPlay[i].enabled) complete = false;
		}
		this.gameComplete = complete;
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.groupgame{
	.players {
		display: flex;
		flex-direction: column;
		width: min-content;
		margin: auto;
		padding: 15px;
		border-radius: 20px;
		color: @mainColor_dark;
		background-color: @mainColor_normal_light;
		.player {
			display: flex;
			flex-direction: row;
			&:not(:last-child) {
				margin-bottom: 10px;
				padding-bottom: 10px;
				border-bottom: 1px solid @mainColor_normal;
			}
			.username {
				width: 150px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			&.me {
				font-family: "Futura";
			}
			&::before {
				content: " ";
				background-color: @mainColor_dark;
				border-radius: 50%;
				display: inline-block;
				width: 5px;
				height: 5px;
				margin-right: 13px;
				margin-top: 7px;
				margin-left: 7px;
				vertical-align: middle;
			}
			&.host {
				&::before {
					background-color: transparent;
					background-image: url("../assets/icons/king.svg");
					@ratio: 16 / 72;
					width: 100px * @ratio;
					height: 72px * @ratio;
					margin-right: 5px;
					margin-left: 0;
					margin-top: 0;
					border-radius: 0;
					vertical-align: baseline;
				}
			}

			.score {
				// color: @mainColor_highlight;
			}
		}
	}

	.complete {
		margin: auto;
		margin-top: 50px;
		width: min-content;
		display: block;
		text-align: center;
		color: @mainColor_dark;
		padding: 15px;
		border-radius: 20px;
		background-color: @mainColor_normal_light;

		.title {
			font-family: "Futura";
			font-size: 25px;
			margin-bottom: 10px;
			white-space: nowrap;
		}

		.wait {
			font-style: italic;
			margin-top: 10px;
		}
	}
}
</style>