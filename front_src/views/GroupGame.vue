<template>
	<div class="groupgame">
		<SimpleLoader v-if="loading" theme="mainColor_normal" />

		<div v-if="room && fullMe && !loading && tracksToPlay && !kicked && !serverReboot && !notEnoughPlayers">
			<CountDown v-if="pause && !roundComplete && !gameComplete && !fullMe.pass" @3SecComplete="on3SecComplete()" @complete="onCountDownComplete()" :seconds="4" :additionalTime="me.handicap" />

			<div class="countDown">
				<div class="label">{{$t('group.game.index', {index:room.gameStepIndex, total:room.gamesCount})}}</div>
				<!-- <ExpertModeState v-if="room.expertMode && room.expertMode.length > 0" class="expertMode" :data="room.expertMode" /> -->
				<TimerRenderer :timerPercent="timerPercent" :duration="room.gameDuration" class="timer" />
			</div>

			<GameView
				v-if="tracksToPlay && tracksToPlay.length > 0"
				:rawTracksData="tracksToPlay"
				:trackscounts="tracksToPlay.length"
				:expertMode="room.expertMode"
				:scoreHistory="room.scoreHistory"
				:forceReveal="fullMe.pass || roundComplete"
				:pause="pause"
				:canGuess="!gaveUp"
				:acceptAlbum="room.acceptAlbum"
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
				v-if="!fullMe.pass && !roundComplete && !gameComplete"
			/>

			<div v-if="roundComplete" class="complete">
				<div class="title" v-if="gameComplete">{{$t('group.game.complete')}}</div>
				<div v-if="isHost" class="content">
					<Button class="button next" :title="$t('group.game.next')" @click="pickRandomTracks()" v-if="!gameComplete" />
					<!-- <Button class="button" :title="$t('group.game.new')" :to="{name:'playlists', params:{mode:'multi'}}" v-if="gameComplete" highlight /> -->
					<Button class="button" :title="$t('group.game.new')" :to="{name:'groupRestart', params:{id:id}}" v-if="gameComplete" highlight />
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
				<GroupUserList class="content" :room="room" :users="users" :me="me" :gameComplete="gameComplete" @kick="onKickUser" />
			</div>
		</div>

		<div v-if="kicked" class="kicked">
			<div>{{$t('group.game.kicked')}}</div>
			<Button :title="$t('global.back')" class="back" white :to="{name:'home'}" />
		</div>

		<div v-if="serverReboot" class="serverReboot">
			<div v-html="$t('group.game.serverReboot')"></div>
			<Button :title="$t('global.back')" class="back" white :to="{name:'home'}" />
		</div>

		<div v-if="notEnoughPlayers" class="serverReboot">
			<div v-html="$t('group.game.notEnoughPlayers')"></div>
			<Button :title="$t('global.back')" class="back" white :to="{name:'home'}" />
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
import TimerRenderer from "@/components/TimerRenderer.vue";
import PlaylistData from "@/vo/PlaylistData";

@Component({
	components:{
		Button,
		GameView,
		CountDown,
		ChatWindow,
		SimpleLoader,
		GroupUserList,
		TimerRenderer,
		ExpertModeState,
	}
})
export default class GroupGame extends Vue {
	//TODO manage case when user reloads the page, the timer restarts from 0

	@Prop()
	public id:string;

	public tracksIds:string = null;
	public tracksToPlay:TrackData[] = [];
	public room:RoomData = null;
	public pause:boolean = true;
	public kicked:boolean = false;
	public gaveUp:boolean = false;
	public loading:boolean = true;
	public serverReboot:boolean = false;
	public loadingSkip:boolean = false;
	public roundComplete:boolean = false;
	public notEnoughPlayers:boolean = false;
	public disposed:boolean = false;
	public timerStarted:boolean = false;
	public me:UserData = null;
	public allTracks:TrackData[] = null;
	public timerPercent:number = 0;
	public timeOffset:number = 0;

	public tracksDataHandler:any;
	public playerSkipHandler:any;
	public guessedTrackHandler:any;
	public playerJoinLeftHandler:any;
	public restartGameHandler:any;
	public userKickedHandler:any;
	public serverRebootHandler:any;

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
		return this.roundComplete && this.room.gamesCount == this.room.gameStepIndex;
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
		this.restartGameHandler = (e) => this.onRestartGame(e);
		this.userKickedHandler = (e) => this.onUserKicked(e);
		this.serverRebootHandler = (e) => this.onServerReboot(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.GUESSED_TRACK, this.guessedTrackHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.PLAYER_PASS, this.playerSkipHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.playerJoinLeftHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, this.playerJoinLeftHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.RESTART_GROUP_GAME, this.restartGameHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.PLAYER_KICKED, this.userKickedHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.SERVER_REBOOT, this.serverRebootHandler);
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
		this.renderFrame();
	}

	public beforeDestroy():void {
		this.disposed = true;
		SockController.instance.removeEventListener(SOCK_ACTIONS.TRACKS_DATA, this.tracksDataHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.GUESSED_TRACK, this.guessedTrackHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.PLAYER_PASS, this.playerSkipHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.playerJoinLeftHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, this.playerJoinLeftHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.RESTART_GROUP_GAME, this.restartGameHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.PLAYER_KICKED, this.userKickedHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.SERVER_REBOOT, this.serverRebootHandler);
	}

	private generateAllTracksCollection():boolean {
		this.loading = true;
		let playlistIds = this.room.playlists.map(p => p.id);
		let playlists = this.$store.state.playlistsCache;
		let selectedPlaylists:PlaylistData[] = [];
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
		//Make a copy of the track to avoid modifying original data
		this.allTracks = JSON.parse(JSON.stringify(this.allTracks));
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
			t.enabled = false;
			t.guessedBy = null;
			t.score = null;
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
	public onTrackFound(track:TrackData):void {
		Api.post("group/guessed", {roomId:this.room.id, user:this.me.id, trackId:track.id});
	}

	/**
	 * Called when host sends tracks to be played
	 */
	private onTracksData(event:SocketEvent):void {
		this.loading = false;
		this.gaveUp = false;
		this.room = event.data;
		this.roundComplete = false;
		this.tracksToPlay = this.room.currentTracks;
		//Reset pass states
		for (let i = 0; i < this.room.users.length; i++) {
			this.room.users[i].pass = false;
		}
		this.pause = true;
		if(this.gameComplete) this.timerPercent = 1;
		else this.timerPercent = 0;
	}

	/**
	 * Called when a player found a track
	 */
	private onGuessedTrack(event:SocketEvent):void {
		let room:RoomData = event.data.room;
		let allGuessed = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const track = this.tracksToPlay[i];
			let t = room.currentTracks.find(t => t.id == track.id);
			if(t.guessedBy) {
				console.log(t);
				// track.guessedBy = t.guessedBy
				if(!track.guessedBy) {
					Vue.set(track, "guessedBy", [t.guessedBy]);
					track.enabled = true;
					track.score = t.score;
				}
			}else{
				allGuessed = false;
			}
		}
		this.roundComplete = allGuessed;
		if(this.gameComplete) this.timerPercent = 1;
		else this.timerPercent = 0;
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
	 * Called when a player joins/leaves the room
	 */
	public onRestartGame(e:SocketEvent):void {
		this.$router.push({name:"group", params:{id:e.data.roomId}})
	}

	/**
	 * Called when a user has been kicked
	 */
	public onUserKicked(e:SocketEvent):void {
		if(e.data.userId == this.me.id) {
			this.kicked = true;
			//Stop all tracks
			for (let i = 0; i < this.tracksToPlay.length; i++) {
				const t = this.tracksToPlay[i];
				t.enabled = true;
			}
		}
		this.room = e.data.room;
		if(this.room.users.length < 2) {
			this.notEnoughPlayers = true;
		}
		this.$store.dispatch("setGroupRoomData", e.data.room);
	}

	/**
	 * Called when server has reboot
	 */
	public onServerReboot(e:SocketEvent):void {
		this.serverReboot = true;
		//Stop all tracks
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const t = this.tracksToPlay[i];
			t.enabled = true;
		}
	}

	/**
	 * Called when player clicks "give up" button
	 */
	public onGiveUp():void {
		this.gaveUp = true;
		Utils.confirm(this.$t('group.game.giveupConfirm.title').toString(), null, this.$t('group.game.giveupConfirm.description').toString())
		.then(async _=> {
			this.loadingSkip = true;
			try {
				await Api.post("group/pass", {userId:this.me.id, roomId:this.room.id});
			}catch(error) {
				this.$store.dispatch("alert", error.message);
			}
			this.loadingSkip = false;
			for (let i = 0; i < this.tracksToPlay.length; i++) {
				const t = this.tracksToPlay[i];
				t.enabled = true;
			}
		}).catch(_=>{/*don't care*/});
	}

	/**
	 * Called when clicking kick button on a user
	 */
	public async onKickUser(user:UserData):Promise<void> {
		Api.post("group/kick", {roomId:this.room.id, userId:user.id});
	}

	/**
	 * Check if game is complete
	 */
	private checkComplete():void {
		let complete = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			if(!this.tracksToPlay[i].enabled) complete = false;
		}
		this.roundComplete = complete;
		if(this.gameComplete) this.timerPercent = 1;
		else this.timerPercent = 0;
	}

	/**
	 * Called when a users skips
	 */
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
			this.endRound();
		}
	}

	/**
	 * Forces end of current round
	 */
	private endRound():void {
		this.roundComplete = true;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const t = this.tracksToPlay[i];
			t.enabled = true;
		}
	}

	/**
	 * Computes the timer
	 */
	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_=>this.renderFrame());
		if(!this.timerStarted || this.roundComplete || this.timerPercent == 1) {
			this.timeOffset = new Date().getTime();
			return;
		}

		let ellapsed = new Date().getTime() - this.timeOffset;
		this.timerPercent = Math.min(1, ellapsed / (this.room.gameDuration * 1000));

		if(this.timerPercent == 1) {
			this.endRound();
		}
	}

	/**
	 * Called when 3 seconds complete
	 */
	public on3SecComplete():void{
		this.timerPercent = 0;
		this.timerStarted = true;
	}

	/**
	 * Called when start countdown completes
	 */
	public onCountDownComplete():void{
		this.timerStarted = true;
		this.pause = false;
		if(!this.me.handicap || this.me.handicap == 0) {
			this.timerPercent = 0;
		}
	}

}
</script>

<style scoped lang="less">
.groupgame{
	.countDown {
		position: relative;
		margin: auto;
		display: block;
		width: 130px;
		height: 130px;
		z-index: 2;
		margin-top: 20px;
		margin-bottom: 40px;
		.expertMode {
			margin-top: 10px;
		}
		.timer {
			width: 100%;
			height: 100%;
		}
		.label {
			.center();
			position: absolute;
			text-align: center;
			font-family: "Futura";
			font-weight: bold;
			font-size: 30px;
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

	.kicked, .serverReboot {
		.center();
		position: absolute;
		color: #FFFFFF;
		background-color: @mainColor_warn;
		padding: 20px;
		border-radius: 20px;
		text-align: center;
		font-size: 24px;
		font-family: "Futura";

		.back {
			margin-top: 10px;
		}
	}
}
</style>