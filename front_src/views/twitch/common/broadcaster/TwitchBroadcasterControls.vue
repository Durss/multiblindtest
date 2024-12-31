<template>
	<div class="twitchbroadcastercontrols">
		<h1>Round {{roundIndex}}/{{gamesCount_num}}</h1>

		<div class="controls">
			<Button title="End this round" v-if="!roundComplete" :disabled="!canSkip" @click="endRound()" />
			<Button title="Next round" v-if="roundComplete && !gameComplete" @click="nextRound()" />
			<Button title="Show results" v-if="gameComplete" @click="onShowResults()" />
			<Button title="Show/hide +Top 4" v-if="gameComplete && showResults && scoreHistory.length > 3" @click="onShowMoreResults()" />
			<Button title="Replay" v-if="gameComplete" @click="restartGame()" />
		</div>

		<div class="timer">{{timeLeft}}</div>

		<div class="tracks" v-if="!showResults">
			<div v-for="t in currentTracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:canReplay="true"
					:burstStars="true"
					:acceptAlbum="acceptAlbum"
					@play="changeTrackPlayState(t,true)"
					@stop="changeTrackPlayState(t,false)"
				/>
			</div>
		</div>
		
		<VolumeButton horizontal class="volume" v-if="mode == 'twitchObs'" />
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import VolumeButton from "@/components/VolumeButton.vue";
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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		Button,
		TrackEntry,
		VolumeButton,
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

	@Prop({default:""})
	public acceptAlbum:string;

	@Prop({default:""})
	public chatConfirm:string;

	@Prop({default:""})
	public mode:string;

	@Prop({default:""})
	public zoom:string;

	@Prop({default:""})
	public acceptDuration:number;

	public loading:boolean = true;
	public ready:boolean = false;
	public disposed:boolean = false;
	public roundComplete:boolean = false;
	public gameComplete:boolean = false;
	public showResults:boolean = false;
	public showMoreResults:boolean = false;
	public canSkip:boolean = false;
	public roundIndex:number = 1;
	public allTracks:TrackData[] = [];
	public currentTracks:TrackData[] = [];
    public scoreHistory:ScoreHistory[] = [];
    public players:IRCTypes.Tag[] = [];
    public startTime:number = 0;
    public ellapsedTime:number = 0;
    public frameDebounce:number = 0;
    public volumeChangeDebounce:number = 0;
    public timeLeft:string = "";
    public ircMessageHandler:any;
    public socketMessageHandler:any;

	private debugGameStarted:number = 0;
	private debugEventsHistory:{date:number, data:any}[] = []

	public get tracksCount_num():number { return parseInt(this.tracksCount); }
	public get gamesCount_num():number { return parseInt(this.gamesCount); }
	public get gameDuration_num():number { return parseInt(this.gameDuration); }

	public async mounted():Promise<void> {
		this.loading = true;
		this.ready = IRCClient.instance.connected;
		if(!this.ready) {
			try {
				let res = await IRCClient.instance.initialize(this.$store.state.twitchLogin, this.$store.state.twitchOAuthToken.access_token);
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
		this.onVolumeChange();

		let res = await Api.post("twitch/user", {token:IRCClient.instance.token});
		SockController.instance.connect();
		SockController.instance.keepBroadcastingLastMessage = true;
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
		seconds = Math.min((this.gameDuration_num-1)*1000, seconds) + 1000;
		this.ellapsedTime = this.gameDuration_num*1000 - seconds;
		let d = new Date(seconds);
		this.timeLeft = Utils.toDigits(d.getMinutes())+":"+Utils.toDigits(d.getSeconds());

		if(seconds<=0) {
			this.endRound();
		}
		
		if(this.mode == "twitchObs") {
			this.frameDebounce ++;
			if(this.frameDebounce > 60*5) {
				this.frameDebounce = 0;
				//This allows to update the currently ellapsed duration to extension
				this.broadcastCurrentState(false);
			}
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
		//Make a copy of the track to avoid modifying original data
		this.allTracks = JSON.parse(JSON.stringify(this.allTracks));
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
			t.pendingAcceptation = false;
			t.guessedBy = null;
			t.score = null;
			toPlay.push(t);
		}
		this.currentTracks = toPlay;
		this.roundComplete = false;
		// console.log(this.currentTracks.map(v=>v.artist + " :: "+v.name).join("\n"));

		//Add 4 seconds, 1 second for websocket message to be sent
		//and 3 seconds for countdown
		this.startTime = Date.now() + 4000;
		
		//Avoids mistakenly double clicking the
		//button "Next round" then "End this round".
		//The "end this round" button will be enabled only
		//after a short delay.
		this.canSkip = false;
		setTimeout(_=> {
			this.canSkip = true;
		}, 500);

		this.debugEventsHistory = [];
		this.debugGameStarted = Date.now();
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
		if(user["message-type"] != "chat") return;//Ignore messages that are not simple chats
		let acceptTitle = !this.expertMode || this.expertMode.indexOf('title') > -1;
		let acceptArtist = !this.expertMode || this.expertMode.indexOf('artist') > -1;
		let acceptAlbum = this.acceptAlbum == "1";
		value = value.toLowerCase();

		this.debugEventsHistory.push({date:Date.now() - this.debugGameStarted, data:{value, user:{username:user.username, "user-id":user["user-id"]}}});

		//Add player to global players collection
		if(!this.players.find(u=> u.username == user.username)) {
			this.players.push(user);
		}

		console.log("Guess track by", user.username);

		for (let i = 0; i < this.currentTracks.length; i++) {
			let t = this.currentTracks[i];
			if(!t.enabled
			&& (
				(acceptTitle && AnswerTester.instance.test(value, t.name, this.expertMode != null)) ||
				(acceptArtist && AnswerTester.instance.test(value, t.artist, this.expertMode != null)) ||
				(acceptAlbum && AnswerTester.instance.test(value, t.album, this.expertMode != null))
			)
			) {
				//If user already found this track, ignore it.
				//Avoids multiple scoring on twitch mode with "multiple winners" mode enabled
				if(t.guessedBy && t.guessedBy.findIndex(v => v.id == user["user-id"]) > -1) continue;

				let score;
				if(t.score) {
					//Track already has a score defined because it's pending acceptation
					score = t.score;
				}else{
					//define how much points the player earns by counting the
					//number of tracks left to be found
					score = this.currentTracks.length;
					for (let j = 0; j < this.currentTracks.length; j++) {
						if(this.currentTracks[j].enabled || this.currentTracks[j].pendingAcceptation) score --;
					}
					t.score = score;
				}

				//In "multiple winners" mode the next players to find a track get 1 point
				//less than the first player with a minimum of 1 point.
				if(t.guessedBy && t.guessedBy.length > 0 && t.pendingAcceptation) {
					score = Math.max(1, score-1);
				}

				//Add to score history
				this.scoreHistory.push({
					trackId:t.id,
					guesserId:user["user-id"],
					score,
				});

				//Add user to guessers list
				if(!t.guessedBy) t.guessedBy = []
				t.guessedBy.push({
					name:user.username,
					id:user["user-id"],
					offline:false,
					score:0,
					handicap:0,
				});

				//"multiple winners" mode, wait desired seconds
				//before showing results
				if(this.acceptDuration) {
					if(!t.pendingAcceptation) {
						t.pendingAcceptation = true;
						//Give some time to other players to also find that track
						console.log("Schedule revealed in", this.acceptDuration+"s");
						setTimeout(_=> {
							//Show first guesser's name and number of other players
							let userName = t.guessedBy[0].name;
							if(t.guessedBy.length > 1) {
								userName += " (+"+(t.guessedBy.length-1)+")";
							}
							this.enableTrack(t, userName);
						}, this.acceptDuration * 1000);
					}
				}else{
					this.enableTrack(t, user.username);
				}

				return;
			}
		}
	}

	/**
	 * Enables a tracks once found
	 */
	private enableTrack(t:TrackData, userName:string):void {
		let chatConfirm = this.chatConfirm == "1";

		t.enabled = true;
		//reset multi winners mode vars
		t.pendingAcceptation = false;
		
		if(chatConfirm) {
			let message = this.$t("twitch.game.confirmChat", {
				USER:userName,
				TITLE:t.name,
				ARTIST:t.artist,
			}).toString();
			IRCClient.instance.sendMessage(message);
		}
		this.checkComplete();
		this.broadcastCurrentState();
	}

	/**
	 * Broadcast the current state to everyone
	 * 
	 * @param verbose defines if a log should be displayed server side
	 */
	private broadcastCurrentState(verbose:boolean = true):void {
		let data:any = {};
		data.round = this.roundIndex;
		data.games = this.gamesCount_num;
		data.duration = this.gameDuration_num;
		data.ellapsedDuration = this.ellapsedTime;
		data.roundComplete = this.roundComplete;
		data.gameComplete = this.gameComplete;
		data.showMoreResults = this.showMoreResults;
		data.zoomLevel = parseFloat(this.zoom);

		if(!this.showResults) {
			data.tracks = this.currentTracks;
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
		if(this.mode == "twitchObs") {
			let event = {
				target:this.$store.state.twitchLogin+"_ext",
				noVerbose:!verbose,
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
		this.debugEventsHistory.push({date:Date.now() - this.debugGameStarted, data:"next"});
		this.roundIndex ++;
		this.ellapsedTime = 0;
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
		if(this.gameComplete) {
			// console.log( JSON.stringify(this.debugEventsHistory) );
			// Api.post("debug/twitchhistory", {data:this.debugEventsHistory})
		}else{
			this.debugEventsHistory.push({date:Date.now() - this.debugGameStarted, data:"end"});
		}
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
	 * Called when clicking "show +Top 4 results" button
	 */
	public onShowMoreResults():void {
		this.showMoreResults = !this.showMoreResults;
		this.broadcastCurrentState();
	}

	/**
	 * Called when clicking "Replay" button
	 */
	public restartGame():void {
		this.gameComplete = false;
		this.roundComplete = false;
		this.showResults = false;
		this.showMoreResults = false;
		this.roundIndex = 1;
		this.scoreHistory = [];
		this.startTime = 0;
		this.ellapsedTime = 0;
		this.pickRandomTracks();
		this.broadcastCurrentState();
	}

	@Watch("$store.state.volume")
	public onVolumeChange():void {
		clearTimeout(this.volumeChangeDebounce);
		this.volumeChangeDebounce = setTimeout(_=> {
			let event = {
				target:this.$store.state.twitchLogin+"_ext",
				data:{action:SOCK_ACTIONS.SEND_TO_UID, data:{actionType:TwitchMessageType.CHANGE_VOLUME, volume:this.$store.state.volume}}
			};
			SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data:event});
		}, 100)
	}

	/**
	 * Restarts a specific song
	 */
	public changeTrackPlayState(t:TrackData, play:boolean):void {
		let event = {
			target:this.$store.state.twitchLogin+"_ext",
			data:{action:SOCK_ACTIONS.SEND_TO_UID, data:{actionType:TwitchMessageType.SET_TRACK_PLAY_STATE, track:t.id, play}}
		};
		SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data:event});
	}

}
</script>

<style scoped lang="less">
.twitchbroadcastercontrols{
	.controls {
		margin-top: 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		button {
			min-width: 200px;
			margin-bottom: 5px;
		}
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

	.volume {
		margin: auto;
		margin-top: 50px;
	}
}
</style>