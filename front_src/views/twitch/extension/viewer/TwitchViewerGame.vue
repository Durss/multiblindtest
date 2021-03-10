<template>
	<div class="twitchviewergame" v-if="rawTracks.length > 0">
		<div class="step">
			<h1>{{$t('twitch.game.index')}}</h1>
			<div class="count">{{currentRound}}/{{gamesCount}}</div>
		</div>

		<VolumeButton twitchMode v-if="!obsMode" />
		
		<TimerRenderer class="timer" ref="timer"
			:timerPercent="timerPercent"
			:duration="duration" />

		<div :class="tracksClasses">
			<div v-for="t in tracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:canReplay="!obsMode"
					:burstStars="true"
					:small="true"
					:scoreHistory="scoreHistory"
					@play="playTrack(t)"
					@stop="stopTrack(t)"
				/>
			</div>
		</div>

		<CountDown v-if="!countDownComplete && !roundComplete" @complete="onCountDownComplete()" class="countdown" />
	</div>
</template>

<script lang="ts">
import AudioPlayer from "@/components/AudioPlayer";
import CountDown from "@/components/CountDown.vue";
import TimerRenderer from "@/components/TimerRenderer.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import VolumeButton from "@/components/VolumeButton.vue";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import TrackData from "@/vo/TrackData";
import { Component, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		CountDown,
		TrackEntry,
		VolumeButton,
		TimerRenderer,
	}
})
export default class TwitchViewerGame extends Vue {

	public gamesCount:number = 0;
	public currentRound:number = 0;
	public timerPercent:number = 0;
	public duration:number = 0;
	public timeOffset:number = 0;
	public tracks:TrackData[] = [];
	public rawTracks:{ id:string, mp3:string, artist:string, name:string, user:string, score:number}[] = [];
	public scoreHistory:ScoreHistory[] = [];
    public countDownComplete:boolean = false;
    public roundComplete:boolean = false;
    public gameComplete:boolean = false;
    public disposed:boolean = false;
    public currentTrackIds:string;
    public audioPlayer:AudioPlayer;
    public clickHandler:any;

	public get obsMode():boolean { return Utils.getRouteMetaValue(this.$route, "obsMode"); }

	public get tracksClasses():string[] {
		let res = ["tracks"];
		if(this.tracks.length == 5) res.push("center3rd");
		return res;
	}

	public mounted():void {
		this.clickHandler = (e:MouseEvent) => {
			if(this.$store.state.needUserInteraction) {
				this.$store.dispatch("setNeedUserInteraction", false);
				if(this.countDownComplete && !this.roundComplete && !this.gameComplete) {
					this.startPlay();
				}
			}
		};

		if(this.obsMode) {
			this.$store.dispatch("setVolume", 1);
		}

		document.addEventListener("click", this.clickHandler);
		this.renderFrame();
		this.onGameStateChange();
	}

	public beforeDestroy():void {
		this.disposed = true;
		if(this.audioPlayer) {
			this.audioPlayer.dispose();
		}
		document.removeEventListener("click", this.clickHandler);
	}

	/**
	 * Start playing songs
	 */
	@Watch("pause")
	public startPlay():void {
		this.audioPlayer.play();
	}

	/**
	 * Create reusable audio elements
	 */
	public initAudioElements():void {
		if(this.audioPlayer) {
			this.audioPlayer.stopAll();
			this.audioPlayer.dispose();
		}
		this.audioPlayer = new AudioPlayer(this.tracks.length);
		this.audioPlayer.onLoadError = (id)=> this.onLoadError(id);
		this.audioPlayer.onLoadComplete = _=> this.onLoadComplete();
		this.audioPlayer.onNeedUserInteraction = _=> {
			this.$store.dispatch("setNeedUserInteraction", true);
		};
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		if(!this.countDownComplete || this.roundComplete || this.gameComplete) {
			this.audioPlayer.pause();
		}
	}

	/**
	 * Called when a track's loading failed
	 */
	public onLoadError(trackId:string):void {
		for (let i = 0; i < this.tracks.length; i++) {
			const element = this.tracks[i];
			if(element.id == trackId) {
				Vue.set(element, "loadFail", true);//Component will show the error
			}
		}
	}

	/**
	 * Called when countdown completes
	 */
	public onCountDownComplete():void {
		this.timerPercent = 0;
		this.countDownComplete = true;
		this.audioPlayer.play();
	}

	/**
	 * Computes the timer
	 */
	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_=>this.renderFrame());
		if(!this.countDownComplete || this.roundComplete || this.timerPercent == 1) {
			this.timeOffset = new Date().getTime();
			return;
		}

		let ellapsed = new Date().getTime() - this.timeOffset;
		this.timerPercent = Math.min(1, ellapsed / (this.duration * 1000));

		if(this.timerPercent == 1) {
			this.audioPlayer.stopAll();
		}
	}

	/**
	 * Called when manually stopping a track.
	 * We can stop a track after revealing all the answers manually in solo mode
	 */
	public stopTrack(data:TrackData):void {
		this.audioPlayer.stopTrack(data);
	}

	/**
	 * Called when manually playing a track.
	 */
	public playTrack(data:TrackData):void {
		if(this.$store.state.volume == 0) {
			this.$store.dispatch("setVolume", .5);
			this.audioPlayer.stopAll();
		}
		this.audioPlayer.unpauseTrack(data);
	}

	@Watch("$store.state.twitchGameState")
	public onGameStateChange():void {
		let state = this.$store.state.twitchGameState;
		this.rawTracks = state.tracks;
		this.gamesCount = state.games;
		this.currentRound = state.round;
		this.duration = state.duration;
		this.gameComplete = state.gameComplete;
		// this.timerPercent = state.ellapsedDuration / this.duration;
		if(!this.countDownComplete) {
			this.timeOffset = Date.now() - state.ellapsedDuration;
			if(state.ellapsedDuration > 0) {
				this.countDownComplete = true;
			}
		}

		let prevEnableStates = this.tracks? this.tracks.map(t=>t.enabled) : null;

		this.tracks = [];
		this.scoreHistory = [];
		if(state.roundComplete != this.roundComplete) {
			this.timerPercent = 1;
			if(this.audioPlayer) {
				this.audioPlayer.stopAll();
			}
		}
		this.roundComplete = state.roundComplete;

		for (let i = 0; i < this.rawTracks.length; i++) {
			const t:any = this.rawTracks[i];
			t.audioPath = t.mp3;
			if(t.user) {
				this.scoreHistory.push({
					trackId:t.id,
					guesserId:t.user,
					score:t.score,
				});
				
				t.guessedBy = {
					name:t.user,
					id:t.user,
					offline:false,
					score:t.score,
					handicap:0,
				};
				if(!prevEnableStates || !prevEnableStates[i] && this.audioPlayer) {
					this.audioPlayer.stopTrack(t);
				}
			}
			this.tracks.push(t);
		}

		let trackIds = this.rawTracks.map(t => t.mp3).join(",");
		if(trackIds != this.currentTrackIds) {
			this.initAudioElements();
			this.currentTrackIds = trackIds;
			this.audioPlayer.populate(this.tracks);
			this.countDownComplete = false;
			this.timerPercent = 0;
		}
		// console.log(this.tracks);
		if(state.roundComplete || state.gameComplete) {
			this.timerPercent = 1;
			this.countDownComplete = true;
		}
	}

	@Watch("$store.state.volume", {immediate: true, deep:true})
	public onVolumeChange(a, b):void {
		if(!this.audioPlayer) return;
		this.audioPlayer.volume = this.$store.state.volume;
	}

}
</script>

<style scoped lang="less">
.twitchviewergame{
	position: relative;
	.countdown {
		position: absolute;
		z-index: 4;
	}
	.step {
		position: absolute;
		width: 100%;
		height: 5.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family: Futura;
		z-index: 2;
		box-sizing: border-box;
		h1 {
			font-size: 1em;
		}
		.count {
			font-size: 1em;
			font-family: FuturaExtraBold;
			margin-top: 5px;
		}
	}

	.timer {
		width: 5.5em;
		height: 5.5em;
		margin: auto;
		z-index: 3;
	}

	.tracks {
		width: 100vw;
		max-width: calc(100vw - 10em);
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		.track {
			width: 45%;
			margin: .3em;
			border: .17em solid #ffffff;
			border-radius: 5em;
			box-sizing: border-box;

			.actualTrack {
				height: 100%;
			}
		}
		&.center3rd {
			.track:nth-child(3) {
				display: block;
				margin: 0 4em;
			}
		}
	}
}
</style>