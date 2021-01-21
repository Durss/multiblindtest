<template>
	<div class="twitchgame">
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

		<div v-if="!loading">
			<TwitchOverlay :tracks="currentTracks"
				:scoreHistory="scoreHistory"
				:duration="gameDuration_num"
				:paused="pause"
				@timerComplete="onTimerComplete()"
				@play="playTtrack"
				@stop="stopTrack" />
			<CountDown v-if="pause" @complete="pause = false" />
		</div>

		<VolumeButton />
	</div>
</template>

<script lang="ts">
import AudioPlayer from "@/components/AudioPlayer";
import BouncingLoader from "@/components/BouncingLoader.vue";
import CountDown from "@/components/CountDown.vue";
import TrackAnswerForm from "@/components/TrackAnswerForm.vue";
import TwitchOverlay from "@/components/TwitchOverlay.vue";
import VolumeButton from "@/components/VolumeButton.vue";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import AnswerTester from "@/utils/AnswerTester";
import StatsManager from "@/utils/StatsManager";
import Utils from "@/utils/Utils";
import TrackData from "@/vo/TrackData";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		CountDown,
		VolumeButton,
		TwitchOverlay,
		BouncingLoader,
	}
})
export default class TwitchGame extends Vue {

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

	public ready:boolean = false;
	public pause:boolean = true;
	public loading:boolean = true;
	public complete:boolean = true;
	public allTracks:TrackData[] = [];
	public currentTracks:TrackData[] = [];
    public scoreHistory:{trackId:string, guesserId:string, score:number}[] = [];
    public audioPlayer:AudioPlayer;
    public clickHandler:any;
    public ircMessageHandler:any;

	public get tracksCount_num():number { return parseInt(this.tracksCount); }
	public get gamesCount_num():number { return parseInt(this.gamesCount); }
	public get gameDuration_num():number { return parseInt(this.gameDuration); }

	public async mounted():Promise<void> {
		this.loading = true;
		this.pause = true;
		this.complete = false;
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

		let users = this.$store.state.twitchAllowedUsers;
		if(!users) {
			//This can be the case if the local storage of the user is full and users
			//have not been saved properly
			this.$router.push({name:"twitch/auth"});
			return;
		}
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
			if(!this.complete) {
				this.$store.dispatch("setNeedUserInteraction", true);
			}
		};
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		this.loading = false;
		this.audioPlayer.pause();
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
		this.complete = allGood;
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
		if(!this.allTracks || this.allTracks.length < this.tracksCount_num) {
			this.generateAllTracksCollection();
		}

		this.allTracks = Utils.shuffle(this.allTracks);
		let toPlay:TrackData[] = [];
		for (let i = 0; i < Math.min(6, Math.max(1, this.tracksCount_num)); i++) {
			let t = this.allTracks.shift();
			toPlay.push(t);
		}
		this.currentTracks = toPlay;
		// this.currentTracks[0].enabled = true;
		// this.currentTracks[0].guessedBy = {
		// 	name:"Durss",
		// 	id:"1",
		// 	offline:false,
		// 	score:5,
		// 	handicap:0,
		// };
		// this.scoreHistory.push({
		// 	trackId:this.currentTracks[0].id,
		// 	guesserId:"1",
		// 	score:4,
		// })

		this.audioPlayer.populate(this.currentTracks);
	}

	/**
	 * Called when receiving a message from twitch
	 */
	public onIrcMessage(e:IRCEvent):void {
		// console.log("IRC MESSAGE");
		// console.log(e.message);
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
		}
		
		//Stops the tracks that have been guessed.
		//This is usefull for multiplayer mode if a player
		//refreshes the page and is asked to click to start playing.
		for (let i = 0; i < this.currentTracks.length; i++) {
			const t = this.currentTracks[i];
			if(t.enabled || this.pause) {
				this.stopTrack(t);
			}
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
				this.$emit("guessed", t);
				let score = this.currentTracks.length + 1;
				for (let j = 0; j < this.currentTracks.length; j++) {
					if(this.currentTracks[j].enabled) score --;
				}

				this.scoreHistory.push({
					trackId:t.id,
					guesserId:user.id,
					score,
				});

				t.guessedBy = {
					name:user["display-name"],
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
		for (let i = 0; i < this.currentTracks.length; i++) {
			const t = this.currentTracks[i];
			t.enabled = true;
		}
		this.audioPlayer.stopAll();
	}

	public playTtrack(track:TrackData):void {
		this.audioPlayer.unpauseTrack(track);
	}

	public stopTtrack(track:TrackData):void {
		this.audioPlayer.stopTrack(track);

	}

}
</script>

<style scoped lang="less">
.twitchgame{
	.loader {
		.center();
		position: absolute;
		top: auto;
		bottom: 0;
	}
}
</style>