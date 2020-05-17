<template>
	<div class="groupgame">
		<SimpleLoader v-if="loading" theme="mainColor_normal" />

		<div v-if="room && fullMe && !loading && tracksToPlay">
			<CountDown v-if="pause && !gameStepComplete && !gameComplete && !fullMe.pass" @complete="pause = false" :seconds="4 + me.handicap" />

			<div class="header">
				<h1>{{$t('group.game.index', {index:room.gameStepIndex, total:room.gamesCount})}}</h1>
				<ExpertModeState v-if="room.expertMode && room.expertMode.length > 0" class="expertMode" :data="room.expertMode" />
			</div>

			<GameView
				v-if="tracksToPlay && tracksToPlay.length > 0"
				:rawTracksData="tracksToPlay"
				:trackscounts="tracksToPlay.length"
				:expertMode="room.expertMode"
				:scoreHistory="room.scoreHistory"
				:forceReveal="fullMe.pass"
				:pause="pause"
				@guessed="onTrackFound"
				ref="game"
				class="game"
			>
				<ChatWindow class="chat" />
			</GameView>
			
			

			<Button
				:title="$t('group.game.giveup')"
				highlight
				:icon="require('@/assets/icons/shrug.svg')"
				class="giveUp"
				@click="onGiveUp()"
				:loading="loadingSkip"
				:disabled="pause"
				v-if="!fullMe.pass && !gameStepComplete && !gameComplete"
			/>

			<div v-if="gameStepComplete" class="complete">
				<div class="title" v-if="gameComplete">{{$t('group.game.complete')}}</div>
				<div v-if="isHost" class="content">
					<Button class="button next" :title="$t('group.game.next')" @click="pickRandomTracks()" v-if="!gameComplete" />
					<Button class="button" :title="$t('group.game.new')" :to="{name:'playlists', params:{mode:'multi'}}" v-if="gameComplete" highlight />
					<Button class="button" :title="$t('global.quit')" :to="{name:'home'}" v-if="gameComplete" highlight />
				</div>
				<div v-if="!isHost && !gameComplete" class="wait">
					<img src="@/assets/loader/loader.svg" alt="loading">
					<div v-html="$t('group.game.wait', {hostName:hostName})"></div>
				</div>
				<div v-if="!isHost && gameComplete" class="content">
					<Button class="button" :title="$t('global.quit')" :to="{name:'home'}" highlight />
				</div>
			</div>

			<div class="players">
				<h2>{{$t('group.game.rank')}}</h2>
				<GroupUserList class="content" :room="room" :users="users" :me="me" :gameComplete="gameComplete" />
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
import ExpertModeState from '../components/ExpertModeState.vue';
import GroupUserList from '../components/GroupUserList.vue';
import CountDown from '../components/CountDown.vue';
import SimpleLoader from '../components/SimpleLoader.vue';
import ChatWindow from '../components/ChatWindow.vue';

@Component({
	components:{
		Button,
		GameView,
		CountDown,
		ChatWindow,
		SimpleLoader,
		GroupUserList,
		ExpertModeState,
	}
})
export default class GroupGame extends Vue {

	@Prop()
	public id:string;

	public tracksIds:string = null;
	public tracksToPlay:TrackData[] = [];
	public room:RoomData = null;
	public pause:boolean = true;
	public loading:boolean = true;
	public loadingSkip:boolean = false;
	public gameStepComplete:boolean = false;
	public me:UserData = null;
	public allTracks:TrackData[] = null;

	public tracksDataHandler:any;
	public playerSkipHandler:any;
	public guessedTrackHandler:any;
	public playerJoinLeftHandler:any;

	public get isHost():boolean { return this.me.id == this.room.creator; }

	public get users():UserData[] {
		if(!this.room) return [];
		let list = this.room.users;
		list.sort((a, b) => {
			if(a.score > b.score) return -1;
			if(a.score < b.score) return 1;
			return 0
		})
		return list;
	}

	public get hostName():string {
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.creator == this.room.users[i].id) {
				return this.room.users[i].name;
			}
		}
		return null;
	}

	public get gameComplete():boolean {
		return this.gameStepComplete && this.room.gamesCount == this.room.gameStepIndex;
	}

	public get fullMe():UserData {
		let ref = this.$store.state.userGroupData;
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == ref.id) {
				return u;
			}
		}
	}

	public async mounted():Promise<void> {
		this.tracksDataHandler = (e) => this.onTracksData(e);
		this.guessedTrackHandler = (e) => this.onGuessedTrack(e);
		this.playerSkipHandler = (e) => this.onPlayerPass(e);
		this.playerJoinLeftHandler = (e) => this.onPlayerJoinLeft(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.GUESSED_TRACK, this.guessedTrackHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.PLAYER_PASS, this.playerSkipHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.playerJoinLeftHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, this.playerJoinLeftHandler);
		this.me = this.$store.state.userGroupData;
		
		if(!this.me) {
			//Redirect to group auth page
			this.$router.push({name:"group", params:{id:this.id}});
			return;
		}
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
		SockController.instance.removeEventListener(SOCK_ACTIONS.PLAYER_PASS, this.playerSkipHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.playerJoinLeftHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, this.playerJoinLeftHandler);
	}

	private generateAllTracksCollection():boolean {
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

		if(selectedPlaylists.length == 0) {
			this.$store.dispatch("alert", this.$t("game.noPlaylists"));
			return false;
		}
		
		this.allTracks = [];
		for (let i = 0; i < selectedPlaylists.length; i++) {
			const p = selectedPlaylists[i];
			this.allTracks = this.allTracks.concat(p.tracks);
		}
		return true;
	}

	/**
	 * Select tracks to be played
	 */
	public pickRandomTracks():void {
		if(!this.allTracks || this.allTracks.length < this.room.tracksCount) {
			if(!this.generateAllTracksCollection()) {
				//User probably deleted the playlist s·he's trying to load tracks from
				this.$router.push({name:"home"});
				return;
			}
		}

		this.allTracks = Utils.shuffle(this.allTracks);
		let toPlay:TrackData[] = [];
		for (let i = 0; i < Math.min(6, Math.max(1, this.room.tracksCount)); i++) {
			let t = this.allTracks.shift();
			toPlay.push(t);
		}
		this.room.currentTracks = toPlay;

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
					this.$router.push({name:"playlists", params:{mode:"multi"}});
				}else{
					this.$router.push({name:"home"});
				}
				return;
			}
			await this.joinRoom();
		}
		if(this.room) {
			SockController.instance.groupId = this.room.id;
			for (let i = 0; i < this.room.users.length; i++) {
				const u = this.room.users[i];
				if(u.id == this.me.id) this.me = u;
				
			}
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
		return await Api.post("group/join", data);
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
		this.loading = false;
		this.room = event.data;
		this.gameStepComplete = false;
		this.tracksToPlay = this.room.currentTracks;
		//Reset pass states
		for (let i = 0; i < this.room.users.length; i++) {
			this.room.users[i].pass = false;
		}
		this.pause = true;
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
		this.gameStepComplete = allGuessed;
		Vue.set(this.room, "users", room.users);
		Vue.set(this.room, "scoreHistory", room.scoreHistory);
	}

	/**
	 * Called when a player joins/leaves the room
	 */
	public onPlayerJoinLeft(e:SocketEvent):void {
		let found = false;
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.user.id) {
				found = true;
				u.offline = e.getType() == SOCK_ACTIONS.LEAVE_ROOM;
			}
		}
		if(!found && e.getType() == SOCK_ACTIONS.JOIN_ROOM) {
			this.room.users.push(e.data.user);
		}
	}

	/**
	 * Check if game is complete
	 */
	private checkComplete():void {
		let complete = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			if(!this.tracksToPlay[i].enabled) complete = false;
		}
		this.gameStepComplete = complete;
	}

	/**
	 * Called when player clicks "give up" button
	 */
	private onGiveUp():void {
		Utils.confirm(this.$t('group.game.giveupConfirm.title').toString(), null, this.$t('group.game.giveupConfirm.description').toString())
		.then(async _=> {
			this.loadingSkip = true;
			try {
				await Api.post("group/pass", {userId:this.me.id, roomId:this.room.id});
			}catch(error) {
				this.$store.dispatch("alert", error.message);
			}
			this.loadingSkip = false;
		}).catch(_=>{/*don't care*/});
	}

	private onPlayerPass(e:SocketEvent):void {
		let room:RoomData = e.data.room;
		let majorityPassed:Boolean = e.data.pass;
		//Update pass state of all users
		for (let i = 0; i < this.room.users.length; i++) {
			const player = this.room.users[i];
			for (let j = 0; j < room.users.length; j++) {
				if(room.users[j].id == player.id) {
					player.pass = room.users[j].pass;
				}
			}
		}
		if(majorityPassed) {
			this.gameStepComplete = true;
			for (let i = 0; i < this.tracksToPlay.length; i++) {
				const t = this.tracksToPlay[i];
				t.enabled = true;
			}
		}
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.groupgame{
	.header {
		margin-bottom: 30px;
		h1 {
			display: block;
			width: min-content;
			white-space: nowrap;
			margin: auto;
		}
		.expertMode {
			margin-top: 10px;
		}
	}

	.giveUp {
		margin: auto;
		margin-bottom: 30px;
		display: block;
		
		::v-deep .icon {
			height: 100%;
			width: 40px;
		}
	}

	.game {
		// Allows the dimmer to be above the other elements of the page
		z-index: 1;
		position: relative;
	}

	.chat {
		margin-bottom: 30px;
	}

	.players {
		display: flex;
		flex-direction: column;
		width: min-content;
		margin: auto;
		border-radius: 20px;
		box-sizing: border-box;
		// color: @mainColor_dark;
		// background-color: @mainColor_normal_light;

		&>.content {
			.blockContent();
		}
	}

	.complete {
		margin: auto;
		margin-bottom: 50px;
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
			white-space: nowrap;
		}

		.wait {
			font-style: italic;
			margin-top: 10px;
			width:220px;
		}
		.content {
			.button:not(.next) {
				margin-top: 10px;
			}
		}
	}
}
</style>