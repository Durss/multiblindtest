<template>
	<div class="twitchoverlay">
		<img :src="icon" class="logo" ref="logo">
		
		<TimerRenderer :percent="percent" :duration="duration * (1-percent)" class="timer" ref="timer" />

		<div class="tracks">
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
import gsap from "gsap";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import TimerRenderer from "./TimerRenderer.vue";
import TrackEntry from "./TrackEntry.vue";

@Component({
	components:{
		TimerRenderer,
		TrackEntry,
	}
})
export default class TwitchOverlay extends Vue {

	@Prop({default:[]})
	public tracks:TrackData[];

	@Prop({default:[]})
	public scoreHistory:{trackId:string, guesserId:string, score:number}[];

	@Prop({default:0})
	public duration:number;

	@Prop({default:true})
	public paused:boolean;

	public percent:number = 0;
	public timeOffset:number = 0;
	public disposed:boolean = false

	public get icon():string {
		if(this.$store.state.hideBackground) {
			return require('@/assets/icons/home_logo_outlined.svg');
		}
		return require('@/assets/icons/home_logo.svg');
	}

	public mounted():void {
		gsap.to(this.$refs.logo, {duration: 1, ease:"Elastic.easeIn", scale:1.2, repeat:-1}).yoyo(true);
		this.timeOffset = new Date().getTime();
		this.renderFrame();
	}

	public beforeDestroy():void {
		this.disposed = true;
		gsap.killTweensOf(this.$refs.logo);
	}

	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_=>this.renderFrame());
		if(this.paused || this.percent == 1) {
			this.timeOffset = new Date().getTime();
			return;
		}

		let ellapsed = new Date().getTime() - this.timeOffset;
		this.percent = Math.min(1, ellapsed / (this.duration * 1000));

		if(this.percent == 1) {
			this.$emit("timerComplete");
		}
	}

}
</script>

<style scoped lang="less">
.twitchoverlay{
	position: absolute;
	bottom: 50px;
	left: 50%;
	transform: translate(-50%, 0);

	.logo {
		width: 110px;
		margin: auto;
		display: block;
		margin-bottom: 40px;
		position: absolute;
		left: 50%;
		top: 30px;
		transform: translate(-50%, 0);
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
	}
}
</style>