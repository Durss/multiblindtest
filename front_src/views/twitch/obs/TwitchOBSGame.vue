<template>
	<div class="twitchobsgame">
		<TwitchControls class="controls"
			@pause="pause = true"
			@start="started = true"
			@next="pickRandomTracks()"
			:showZone.sync="showZone" />

		<BouncingLoader
			v-if="loading && ready"
			class="loader musicLoader"
			:icon="require('@/assets/icons/spotify_color.svg')"
			label="Loading songs..." />

		<BouncingLoader
			v-if="!ready"
			class="loader twitchLoader"
			:icon="require('@/assets/icons/twitch.svg')"
			label="Connecting to Twitch..." />

		<div v-if="!loading && !showResults" :class="gameClasses">
			<div class="obsHelp" v-if="showZone">Display this area on your stream by cropping it on OBS</div>
			<TwitchGameOverlay :tracks="currentTracks"
				:scoreHistory="scoreHistory"
				:duration="gameDuration_num"
				:paused="pause"
				:gamesCount="gamesCount"
				:currentStep="currentStep"
				:stepComplete="stepComplete"
				@timerComplete="onTimerComplete()"
				@end="onGameFinished()"
				@play="playTtrack"
				@stop="stopTrack" />
			<CountDown class="countdown" v-if="countdown" @complete="countdown = pause = false" />
		</div>

		<TwitchResultsOverlay class="content"
			v-if="showResults"
			:scoreHistory="scoreHistory" />

		<VolumeButton />
	</div>
</template>

<script lang="ts">
import AudioPlayer from "@/components/AudioPlayer";
import BouncingLoader from "@/components/BouncingLoader.vue";
import CountDown from "@/components/CountDown.vue";
import TwitchControls from "@/components/twitch/TwitchControls.vue";
import TwitchGameOverlay from "@/components/twitch/TwitchGameOverlay.vue";
import TwitchResultsOverlay from "@/components/twitch/TwitchResultsOverlay.vue";
import VolumeButton from "@/components/VolumeButton.vue";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import AnswerTester from "@/utils/AnswerTester";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import TrackData from "@/vo/TrackData";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		CountDown,
		VolumeButton,
		TwitchControls,
		TwitchGameOverlay,
		TwitchResultsOverlay,
		BouncingLoader,
	}
})
export default class TwitchOBSGame extends Vue {

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
	public twitchLogin:string;

	public ready:boolean = false;
	public started:boolean = false;
	public showZone:boolean = false;
	public countdown:boolean = false;
	public pause:boolean = true;
	public loading:boolean = true;
	public stepComplete:boolean = false;
	public gameComplete:boolean = false;
	public showResults:boolean = false;//TODO Revert
	public currentStep:number = 0;
	public allTracks:TrackData[] = [];
	public currentTracks:TrackData[] = [];
    public scoreHistory:ScoreHistory[] = [];
    public audioPlayer:AudioPlayer;
    public clickHandler:any;
    public ircMessageHandler:any;

	public get tracksCount_num():number { return parseInt(this.tracksCount); }
	public get gamesCount_num():number { return parseInt(this.gamesCount); }
	public get gameDuration_num():number { return parseInt(this.gameDuration); }
	public get gameClasses():string[] {
		let res:string[] = ["content"];
		if(this.showZone) res.push("showZone");
		return res;
	}

	public async mounted():Promise<void> {
		this.loading = true;
		this.pause = true;
		this.ready = IRCClient.instance.connected;
		if(!this.ready) {
			let res
			try {
				res = await IRCClient.instance.initialize(this.$store.state.twitchLogin, this.$store.state.twitchOAuthToken);
			}catch(error) {
				this.$router.push({name:"twitch/auth"});
				return;
			}
			this.ready = true;
		}

		// let users = this.$store.state.twitchAllowedUsers;
		// if(!users) {
		// 	//This can be the case if the local storage of the user is full and users
		// 	//have not been saved properly
		// 	this.$router.push({name:"twitch/auth"});
		// 	return;
		// }
		this.initAudioElements();
		this.pickRandomTracks();

		this.ircMessageHandler = (e:IRCEvent) => this.onIrcMessage(e);
		IRCClient.instance.addEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);

		this.clickHandler = (e) => {
			if(this.$store.state.needUserInteraction) {
				this.startPlay();
			}
		};
		document.addEventListener("click", this.clickHandler);
	}

	public beforeDestroy():void {
		if(this.audioPlayer) {
			this.audioPlayer.dispose();
		}
		IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);
		document.removeEventListener("click", this.clickHandler);
	}

	/**
	 * Create reusable audio elements
	 */
	public initAudioElements():void {
		this.audioPlayer = new AudioPlayer(this.tracksCount_num);
		this.audioPlayer.onLoadError = (id)=> this.onLoadError(id);
		this.audioPlayer.onLoadComplete = _=> this.onLoadComplete();
		this.audioPlayer.onNeedUserInteraction = _=> {
			this.checkComplete();
			this.$store.dispatch("setNeedUserInteraction", true);
		};
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		this.loading = false;
		this.audioPlayer.pause();
		this.countdown = this.pause;
	}

	/**
	 * Called when a track's loading failed
	 */
	public onLoadError(trackId:string):void {
		for (let i = 0; i < this.currentTracks.length; i++) {
			const element = this.currentTracks[i];
			if(element.id == trackId) {
				Vue.set(element, "loadFail", true);//Component will show the error
			}
		}
	}

	/**
	 * Used to catch changes made by the GroupGame view
	 * when playing in multi player mode
	 */
	// @Watch("tracksToPlay", {immediate: false, deep:false})
	public checkComplete():void {
		let allGood = true;
		//Check if all the tracks have been found
		for (let i = 0; i < this.currentTracks.length; i++) {
			const t = this.currentTracks[i];
			if(!t.enabled && !t.loadFail) {
				allGood = false;
			}else{
				this.stopTrack(t);
			}
		}
		if(allGood) {
			this.onTimerComplete();
		}
	}

	/**
	 * Called when manually stopping a track.
	 * We can stop a track after revealing all the answers manually in solo mode
	 */
	public stopTrack(data:TrackData):void {
		this.audioPlayer.stopTrack(data);
	}

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

	public pickRandomTracks():void {
		this.loading = true;
		this.currentStep ++;
		if(!this.allTracks || this.allTracks.length < this.tracksCount_num) {
			this.generateAllTracksCollection();
		}

		this.allTracks = Utils.shuffle(this.allTracks);
		let toPlay:TrackData[] = [];
		for (let i = 0; i < Math.min(6, Math.max(1, this.tracksCount_num)); i++) {
			let t = this.allTracks.shift();
			t.enabled = false;
			toPlay.push(t);
		}
		this.currentTracks = toPlay;
		this.stepComplete = false;

		this.audioPlayer.populate(this.currentTracks);
	}

	/**
	 * Called when receiving a message from twitch
	 */
	public onIrcMessage(e:IRCEvent):void {
		console.log("IRC MESSAGE");
		console.log(e.tags);
		this.guessTrack(e.message, e.tags);
	}

	/**
	 * Start playing songs
	 */
	@Watch("pause")
	public startPlay():void {
		this.$store.dispatch("setNeedUserInteraction", false);
		if(!this.pause) {
			this.audioPlayer.play();
		}else{
			this.audioPlayer.stopAll();
		}
	}
	

	/**
	 * Called when user submits a guess via the form
	 */
	public guessTrack(value:string, user:IRCTypes.Tag):any {
		let acceptTitle = !this.expertMode || this.expertMode.indexOf('title') > -1;
		let acceptArtist = !this.expertMode || this.expertMode.indexOf('artist') > -1;
		value = value.toLowerCase();
		
		for (let i = 0; i < this.currentTracks.length; i++) {
			let t = this.currentTracks[i];
			if(!t.enabled
			&& (
				(acceptTitle && AnswerTester.instance.test(value, t.name, this.expertMode != null)) ||
				(acceptArtist && AnswerTester.instance.test(value, t.artist, this.expertMode != null))
			)
			) {
				t.enabled = true;
				this.audioPlayer.stopTrack(t);
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
				break;
			}
		}

		this.checkComplete();
	}

	@Watch("$store.state.volume", {immediate: true, deep:true})
	public onVolumeChange(a, b):void {
		if(!this.audioPlayer) return;
		this.audioPlayer.volume = this.$store.state.volume;
	}

	public onTimerComplete():void {
		console.log("TIMER COMPLETE");
		for (let i = 0; i < this.currentTracks.length; i++) {
			const t = this.currentTracks[i];
			t.enabled = true;
		}
		this.stepComplete = true;
		this.audioPlayer.stopAll();
		this.gameComplete = this.currentStep == this.gamesCount_num;
	}

	public playTtrack(track:TrackData):void {
		this.audioPlayer.unpauseTrack(track);
	}

	public stopTtrack(track:TrackData):void {
		this.audioPlayer.stopTrack(track);
	}

	public onGameFinished():void {
		this.showResults = true;
	}

}
</script>

<style scoped lang="less">
.twitchobsgame{
	max-width: 100% !important;
	overflow: hidden;

	.loader {
		.center();
		position: absolute;
	}

	.countdown {
		/deep/ .number {
			font-size: 260px;
		}
	}

	.obsHelp {
		position: absolute;
		transform: translateY(-100%);
		color: @mainColor_alert;
		padding: 5px;
		border: 1px dashed rgba(255, 0, 0, .25);
	}

	.content {
		position: absolute;
		bottom: 0px;
		left: 50%;
		margin-bottom: 20px;
		transform: translate(-50%, 0);
		min-height: 330px;
		box-sizing: border-box;
		&.showZone {
			background-image: url('../../../assets/icons/dashedBg.svg');
			background-size: 20px 20px;
			background-position: center center;
		}
	}

	.controls {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
	}
}
</style>