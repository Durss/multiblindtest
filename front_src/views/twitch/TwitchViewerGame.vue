<template>
	<div class="twitchviewergame" v-if="rawTracks.length > 0">
		<div class="step">
			<h1>{{$t('twitch.game.index')}}</h1>
			<div class="count">{{currentRound}}/{{gamesCount}}</div>
		</div>
		
		<TimerRenderer class="timer" ref="timer"
			:timerPercent="timerPercent"
			:duration="duration" />

		<div :class="tracksClasses">
			<div v-for="t in tracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:canReplay="true"
					:burstStars="true"
					:scoreHistory="scoreHistory"
					:small="smallEntry"
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
import ScoreHistory from "@/vo/ScoreHistory";
import TrackData from "@/vo/TrackData";
import { Component, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		CountDown,
		TrackEntry,
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
    public disposed:boolean = false;
    public currentTrackIds:string;
    public audioPlayer:AudioPlayer;
    public clickHandler:any;

	public get smallEntry():boolean { return true;/*document.body.clientHeight < 600;*/ }

	public get tracksClasses():string[] {
		let res = ["tracks"];
		if(this.smallEntry) res.push("small");
		if(this.tracks.length == 5) res.push("center3rd");
		return res;
	}

	public mounted():void {
		this.clickHandler = (e:MouseEvent) => {
			if(this.$store.state.needUserInteraction) {
				this.startPlay();
			}
		};
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
		this.$store.dispatch("setNeedUserInteraction", false);
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
		this.audioPlayer.pause();
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
			this.$emit("timerComplete");
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
	.step {
		position: absolute;
		width: 100%;
		height: 100px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family: Futura;
		z-index: 2;
		box-sizing: border-box;
		h1 {
			font-size: 20px;
		}
		.count {
			font-size: 18px;
			font-family: FuturaExtraBold;
			margin-top: 5px;
		}
	}

	.timer {
		width: 100px;
		height: 100px;
		margin: auto;
		z-index: 1;
	}

	.tracks {
		width: 100vw;
		max-width: 800px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		.track {
			width: 45%;
			height: 90px;
			margin: 10px;
			border: 5px solid #ffffff;
			border-radius: 50px;
			box-sizing: border-box;

			.actualTrack {
				height: 100%;
			}
		}
		&.center3rd {
			.track:nth-child(3) {
				display: block;
				margin: 0 100px;
			}
		}
		&.small {
			.track {
				margin: 5px;
				height: 50px;
				border-width: 2px;
			}
		}
	}

	.countdown {

	}
}
</style>