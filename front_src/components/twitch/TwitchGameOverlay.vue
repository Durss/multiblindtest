<template>
	<div class="twitchgameoverlay">
		<div class="step">
			<h1>{{$t('twitch.game.index')}}</h1>
			<div class="count">{{currentStep}}/{{gamesCount}}</div>
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
					@play="$emit('play', t)"
					@stop="$emit('stop', t)"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import TrackData from "@/vo/TrackData";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from "@/components/Button.vue";
import TimerRenderer from "@/components/TimerRenderer.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import gsap from "gsap";
import ScoreHistory from "@/vo/ScoreHistory";

@Component({
	components:{
		Button,
		TrackEntry,
		TimerRenderer,
	}
})
export default class TwitchGameOverlay extends Vue {

	@Prop({default:null})
	public tracks:TrackData[];

	@Prop({default:null})
	public scoreHistory:ScoreHistory[];

	@Prop({default:0})
	public duration:number;

	@Prop({default:0})
	public currentStep:number;

	@Prop({default:0})
	public gamesCount:number;

	@Prop({default:true})
	public paused:boolean;

	@Prop({default:true})
	public stepComplete:boolean;

	public timerPercent:number = 0;
	public timeOffset:number = 0;
	public disposed:boolean = false;

	public get tracksClasses():string[] {
		let res = ["tracks"];
		if(this.tracks.length == 5) res.push("center3rd");
		return res;
	}

	public get icon():string {
		if(this.$store.state.hideBackground) {
			return require('@/assets/icons/home_logo_outlined.svg');
		}
		return require('@/assets/icons/home_logo.svg');
	}

	public mounted():void {
		this.timeOffset = new Date().getTime();
		this.renderFrame();
	}

	public beforeDestroy():void {
		this.disposed = true;
	}

	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_=>this.renderFrame());
		if(this.paused || this.timerPercent == 1) {
			this.timeOffset = new Date().getTime();
			return;
		}

		let ellapsed = new Date().getTime() - this.timeOffset;
		this.timerPercent = Math.min(1, ellapsed / (this.duration * 1000));

		if(this.timerPercent == 1) {
			this.$emit("timerComplete");
		}
	}

	@Watch("tracks")
	private onTracksChange():void {
		this.timerPercent = 0;
	}

	@Watch("stepComplete")
	private onStepCompleteChange():void {
		gsap.to(this, {duration: 1.5, timerPercent:1});
	}

}
</script>

<style scoped lang="less">
.twitchgameoverlay{
	padding-top: 65px;

	.step {
		position: absolute;
		width: 100%;
		height: 200px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-size: 40px;
		font-family: Futura;
		z-index: 2;
		.count {
			font-size: 30px;
			font-family: FuturaExtraBold;
			margin-top: 5px;
		}
	}

	.timer {
		width: 200px;
		height: 200px;
		margin: auto;
		z-index: 1;
	}

	.tracks {
		width: 100vw;
		max-width: 1100px;
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
	}
}
</style>