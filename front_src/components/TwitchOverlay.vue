<template>
	<div class="twitchoverlay">
		<img :src="icon" class="logo">
		<div class="tracks">
			<div v-for="t in tracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:forceReveal="false"
					:canReplay="false"
					:burstStars="true"
					:scoreHistory="scoreHistory"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import TrackData from "@/vo/TrackData";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import TrackEntry from "./TrackEntry.vue";

@Component({
	components:{
		TrackEntry,
	}
})
export default class TwitchOverlay extends Vue {

	@Prop({default:[]})
	public tracks:TrackData[];

	@Prop({default:[]})
	public scoreHistory:{trackId:string, guesserId:string, score:number}[];

	public get icon():string {
		if(this.$store.state.hideBackground) {
			return require('@/assets/icons/home_logo_outlined.svg');
		}
		return require('@/assets/icons/home_logo.svg');
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
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
		width: 220px;
		margin: auto;
		display: block;
		// margin-bottom: -50px;
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