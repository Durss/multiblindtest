<template>
	<div class="twitchbroadcastercontrols">
		<h1>Round {{roundIndex}}/{{gamesCount_num}}</h1>

		<div class="controls">
			<Button title="End this round" v-if="!roundComplete" @click="endRound()" />
			<Button title="Next round" v-if="roundComplete && !gameComplete" @click="nextRound()" />
			<Button title="Show results" v-if="gameComplete" @click="onShowResults()" />
			<Button title="Replay" v-if="gameComplete" @click="restartGame()" />
		</div>

		<div class="timer">{{timeLeft}}</div>

		<div class="tracks">
			<div v-for="t in currentTracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:canReplay="false"
					:burstStars="true"
					:scoreHistory="scoreHistory"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import AnswerTester from "@/utils/AnswerTester";
import Api from "@/utils/Api";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import SocketEvent from "@/vo/SocketEvent";
import TrackData from "@/vo/TrackData";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
		TrackEntry,
		BouncingLoader,
	}
})
export default class TwitchBroadcasterControls extends Vue {

	@Prop({default:""})
	public playlistids:string;
	
	@Prop({default:""})
	public tracksCount:string;

	@Prop({default:""})
	public gamesCount:string;

	@Prop({default:""})
	public gameDuration:string;

	@Prop({default:""})
	public expertMode:string;

	public loading:boolean = true;
	public ready:boolean = false;
	public disposed:boolean = false;
	public roundComplete:boolean = false;
	public gameComplete:boolean = false;
	public showResults:boolean = false;
	public roundIndex:number = 1;
	public allTracks:TrackData[] = [];
	public currentTracks:TrackData[] = [];
    public scoreHistory:ScoreHistory[] = [];
    public players:IRCTypes.Tag[] = [];
    public startTime:number = 0;
    public timeLeft:string = "";
    public ircMessageHandler:any;
    public socketMessageHandler:any;

	public get tracksCount_num():number { return parseInt(this.tracksCount); }
	public get gamesCount_num():number { return parseInt(this.gamesCount); }
	public get gameDuration_num():number { return parseInt(this.gameDuration); }

	public async mounted():Promise<void> {
		this.loading = true;
		this.ready = IRCClient.instance.connected;
		if(!this.ready) {
			let res;
			try {
				res = await IRCClient.instance.initialize(this.$store.state.twitchLogin, this.$store.state.twitchOAuthToken);
			}catch(error) {
				this.$router.push({name:"twitch/auth"});
				return;
			}
			this.ready = true;
		}

		this.ircMessageHandler = (e:IRCEvent) => this.onIrcMessage(e);
		IRCClient.instance.addEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);

		//Load test if chat is spammed
		// let u:any = []
		// u.username = "Durss";
		// u["user-id"] = "56413023";
		// setInterval(_=> {
		// 	for (let i = 0; i < 150; i++) {
		// 		this.guessTrack((Math.random()*9999999999999999999).toString(26), u);
		// 	}
		// },1000)
		this.pickRandomTracks();
		this.broadcastCurrentState();
		this.renderFrame();

		let res = await Api.post("twitch/user", {token:IRCClient.instance.token});
		SockController.instance.connect();
		SockController.instance.user = {
											name:"controler",
											id:res.user.user_id+"_ctrl",
											offline:false,
											score:0,
											handicap:0,
										};
		this.socketMessageHandler = (e:SocketEvent) => this.onSocketMessage(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, this.socketMessageHandler);
	}

	public beforeDestroy():void {
		this.disposed = true;
		IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, this.socketMessageHandler);
	}

	/**
	 * Called when receiving a message via socket
	 * This is used when the broadcaster uses the embeded controls
	 * on his/her stream extension
	 */
	public onSocketMessage(e:SocketEvent):void {
		this.parseBroadcasterCommands(e.data);
	}

	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_=> this.renderFrame());
		if(this.roundComplete || this.startTime == 0) {
			this.timeLeft = "00:00";
			return;
		}

		let seconds = this.gameDuration_num*1000 - (Date.now() - this.startTime);
		seconds = Math.min((this.gameDuration_num-1)*1000, seconds);
		let d = new Date(seconds+1000);
		this.timeLeft = Utils.toDigits(d.getMinutes())+":"+Utils.toDigits(d.getSeconds());

		if(seconds<=0) {
			this.endRound();
		}
	}

	/**
	 * Creates an array with all the tracks that can be played
	 */
	private generateAllTracksCollection():void {
		this.allTracks = [];
		let selectedPlaylists = [];
		let playlists = this.$store.state.playlistsCache;
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
			if(this.playlistids.indexOf(p.id) > -1) {
				selectedPlaylists.push(p);
			}
		}
		this.allTracks = [];
		for (let i = 0; i < selectedPlaylists.length; i++) {
			const p = selectedPlaylists[i];
			this.allTracks = this.allTracks.concat(p.tracks);
		}
	}

	/**
	 * Picks up random tracks amongst the ones that have not been used yet
	 * Once all tracks have been used, recycle the old ones
	 */
	public pickRandomTracks():void {
		this.loading = true;
		if(!this.allTracks || this.allTracks.length < this.tracksCount_num) {
			this.generateAllTracksCollection();
		}

		this.allTracks = Utils.shuffle(this.allTracks);
		let toPlay:TrackData[] = [];
		for (let i = 0; i < Math.min(6, Math.max(1, this.tracksCount_num)); i++) {
			let t = this.allTracks.shift();
			t.enabled = false;
			t.guessedBy = null;
			toPlay.push(t);
		}
		this.currentTracks = toPlay;
		this.roundComplete = false;
		// console.log(this.currentTracks.map(v=>v.artist + " :: "+v.name).join("\n"));

		//Add 4 seconds, 1 second for websocket message to be sent
		//and 3 seconds for countdown
		this.startTime = Date.now() + 4000;
	}

	/**
	 * Called when receiving a message from twitch
	 */
	public onIrcMessage(e:IRCEvent):void {
		if(e.tags.badges && e.tags.badges.broadcaster === "1") {
			if(this.parseBroadcasterCommands(e.message)) return;
		}

		if(this.roundComplete) return;

		this.guessTrack(e.message, e.tags);
	}

	/**
	 * Parses for specific commands only allowed by the broadcaster.
	 * This allow to skip a game, start the next one or show the results
	 * without looking at the multiblindtest page.
	 */
	private parseBroadcasterCommands(message:string):boolean {
		switch(message.toLowerCase()) {
			// case "!start":
			// case "!go":
			// 	if(state.twitchPlaylists) {
			// 		this
			// 		return true;
			// 	}
			// 	break;

			case "!skip":
			case "!pass":
			case "!passer":
			case "⏹️":
				if(!this.roundComplete) {
					this.endRound();
					return true;
				}
				break;

			case "!next":
			case "!suite":
			case "!continue":
			case "⏭️":
				if(this.roundComplete && !this.gameComplete) {
					this.nextRound();
					return true;
				}
				break;

			case "!res":
			case "!result":
			case "!results":
			case "🏆":
				if(this.gameComplete) {
					this.onShowResults();
					return true;
				}
				break;

			case "!restart":
			case "!replay":
			case "!rejouer":
			case "!game":
			case "🔁":
				if(this.gameComplete) {
					this.restartGame();
					return true;
				}
				break;
		}
		return false;
	}
	
	/**
	 * Called for every message sent on twitch chat.
	 * Check if it matches the answer
	 */
	public guessTrack(value:string, user:IRCTypes.Tag):any {
		let acceptTitle = !this.expertMode || this.expertMode.indexOf('title') > -1;
		let acceptArtist = !this.expertMode || this.expertMode.indexOf('artist') > -1;
		value = value.toLowerCase();
		let newState = false;
		
		for (let i = 0; i < this.currentTracks.length; i++) {
			let t = this.currentTracks[i];
			if(!t.enabled
			&& (
				(acceptTitle && AnswerTester.instance.test(value, t.name, this.expertMode != null)) ||
				(acceptArtist && AnswerTester.instance.test(value, t.artist, this.expertMode != null))
			)
			) {
				t.enabled = true;
				let score = this.currentTracks.length + 1;
				for (let j = 0; j < this.currentTracks.length; j++) {
					if(this.currentTracks[j].enabled) score --;
				}

				this.scoreHistory.push({
					trackId:t.id,
					guesserId:user["user-id"],
					score,
				});

				t.guessedBy = {
					name:user.username,
					id:user.id,
					offline:false,
					score:0,
					handicap:0,
				};

				newState = true;
				break;
			}
		}

		//Add player to global players collection
		if(!this.players.find(u=> u.username == user.username)) {
			this.players.push(user);
		}

		this.checkComplete();
		if(newState) {
			this.broadcastCurrentState();
		}
	}

	/**
	 * Broadcast the current state to everyone
	 */
	private broadcastCurrentState():void {
		let data:any = {};
		data.round = this.roundIndex;
		data.games = this.gamesCount_num;
		data.duration = this.gameDuration_num;
		data.roundComplete = this.roundComplete;
		data.gameComplete = this.gameComplete;
		if(!this.showResults) {
			//Game data
			let tracks = [];
			for (let i = 0; i < this.currentTracks.length; i++) {
				const t = this.currentTracks[i];
				let h = this.scoreHistory.find(h => h.trackId == t.id);
				tracks.push({
					id:t.id,
					enabled:t.enabled,
					mp3:t.audioPath,
					artist:t.enabled? t.artist:null,
					name:t.enabled? t.name:null,
					user:t.guessedBy? t.guessedBy.name : null,
					score:h? h.score : null,
				})
			}
			data.tracks = tracks;
		}else{
			//Results data
			for (let i = 0; i < this.scoreHistory.length; i++) {
				const h = this.scoreHistory[i];
				if(h.guesserId) {
					let player = this.players.find(p => p["user-id"] == h.guesserId);
					if(player) {
						h.guesserName = player.username;
					}
				}
			}
			//Remove players with a 0 score and only keep the nicknames
			data.history = this.scoreHistory;
		}
		let actionType = this.showResults? TwitchMessageType.LEADERBOARD : TwitchMessageType.ROUND_STATE;
		if(Utils.getRouteMetaValue(this.$route, "obsMode")) {
			let event = {
				target:this.$store.state.twitchLogin+"_ext",
				data:{action:SOCK_ACTIONS.SEND_TO_UID, data:{actionType, state:data}}
			};
			SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data:event});
		}else{
			TwitchExtensionHelper.instance.broadcast(actionType, {state:data});
		}
	}

	/**
	 * Used to catch changes made by the GroupGame view
	 * when playing in multi player mode
	 */
	// @Watch("tracksToPlay", {immediate: false, deep:false})
	private checkComplete():void {
		let allGood = true;
		//Check if all the tracks have been found
		for (let i = 0; i < this.currentTracks.length; i++) {
			const t = this.currentTracks[i];
			if(!t.enabled && !t.loadFail) {
				allGood = false;
			}
		}
		if(allGood) {
			this.endRound();
		}
	}

	/**
	 * Called when clicking "next round" button
	 */
	public nextRound():void {
		this.roundIndex ++;
		this.pickRandomTracks();
		this.broadcastCurrentState();
	}

	/**
	 * Called when clicking "end round" button
	 */
	public endRound():void {
		for (let i = 0; i < this.currentTracks.length; i++) {
			this.currentTracks[i].enabled = true;
		}
		this.roundComplete = true;
		this.gameComplete = this.roundIndex == this.gamesCount_num;
		this.broadcastCurrentState();
	}

	/**
	 * Called when clicking "show results" button
	 */
	public onShowResults():void {
		this.showResults = true;
		this.broadcastCurrentState();
	}

	/**
	 * Called when clicking "show results" button
	 */
	public restartGame():void {
		this.gameComplete = false;
		this.roundComplete = false;
		this.showResults = false;
		this.roundIndex = 1;
		this.scoreHistory = [];
		this.pickRandomTracks();
		this.broadcastCurrentState();
	}

}
</script>

<style scoped lang="less">
.twitchbroadcastercontrols{
	.controls {
		margin-top: 20px;
		text-align: center;
	}

	.tracks {
		margin-top: 20px;
		.track {
			margin-bottom: 5px;
		}
	}

	.timer {
		display: block;
		margin: auto;
		width: min-content;
		margin-top: 20px;
		font-size: 30px;
		font-family: "Futura";
		font-weight: bold;
	}
}
</style>