<template>
	<div :class="classes">
		<img src="@/assets/icons/song.svg" alt="song" class="icon">
		
		<div v-if="data.enabled" class="trackInfos">
			<div class="artist">{{data.artist}}</div>
			<div class="name">{{data.name}}</div>
		</div>
		
		<p v-if="!data.enabled" class="placeholder">{{$t('game.hidden')}}</p>

		<div class="stop" v-if="data.enabled && canStop" :data-tooltip="$t('game.stopTrack')">
			<img src="@/assets/icons/stop.svg" alt="song" class="icon" @click="$emit('stop', data)">
			<img src="@/assets/loader/loader_border.svg" alt="song" class="icon loader" @click="onClickStop()">
		</div>

		<div class="guesser" v-if="data.guessedBy">{{data.guessedBy.name}}</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import TrackData from '@/vo/TrackData';

@Component({
	components:{}
})
export default class TrackEntry extends Vue {

	@Prop()
	public data:TrackData;
	
	public canStop:boolean = false;

	public get classes():string[] {
		let res = ["trackentry"];
		if(this.data.enabled) res.push("enabled");
		return res;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public allowManualStop():void {
		this.canStop = true;
	}

	public onClickStop():void {
		this.$emit('stop', this.data);
		this.canStop = false;
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.trackentry{
	background-color: @mainColor_normal;
	color: #fff;
	max-width: 500px;
	border-radius: 50px;
	text-align: center;
	padding: 10px;
	opacity: .5;
	transition: all .25s;
	box-sizing: border-box;
	display: flex;
	flex-direction: row;
	align-items: center;
	position: relative;

	&>.icon {
		max-height: 35px;
	}

	.stop {
		width: 45px;
		height: 45px;
		min-width: 45px;
		cursor: pointer;
		position: relative;
		
		.icon {
			width: 100%;
			height: 100%;
		}
		.loader {
			position: absolute;
			top:-2px;
			left:-2px;
			width: calc(100% + 4px);
			height: calc(100% + 4px);
		}
	}

	&.enabled {
		opacity: 1;
		// background-color: @mainColor_warn;
	}

	.trackInfos {
		font-size: 20px;
		flex-grow: 1;
		.artist {
			font-weight: bold;
			margin-bottom: 5px;
		}
	}

	.placeholder {
		flex-grow: 1;
		font-size: 30px;
		font-family: "Arial";
		font-weight: bold;
	}

	.guesser {
		position: absolute;
		right: 0;
		bottom: 0;
		background-color: @mainColor_warn;
		padding: 5px 10px;
		border-radius: 100px;
		font-family: "Futura";
		transform: translate(10px, 25%);
	}
}

@media only screen and (max-width: 500px) {
	.trackentry {

		padding: 7px;
		&>.icon {
			max-height: 20px;
		}

		.trackInfos {
			font-size: 16px;
			flex-grow: 1;
			.artist {
				font-weight: bold;
				margin-bottom: 5px;
			}
		}

		.placeholder {
			flex-grow: 1;
			font-size: 20px;
			font-family: "Arial";
			font-weight: bold;
		}

		.stop {
			width: 30px;
			height: 30px;
			min-width: 30px;
		}
	}
}
</style>