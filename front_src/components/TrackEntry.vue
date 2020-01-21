<template>
	<div :class="classes">
		<img src="@/assets/icons/song.svg" alt="song" class="icon">
		
		<div v-if="data.enabled" class="trackInfos">
			<div class="artist">{{data.artist}}</div>
			<div class="name">{{data.name}}</div>
		</div>
		
		<p v-if="!data.enabled" class="placeholder">???</p>

		<div class="stop" v-if="data.enabled && canStop" data-tooltip="Stop this track">
			<img src="@/assets/icons/stop.svg" alt="song" class="icon" @click="$emit('stop', data)">
			<img src="@/assets/loader/loader_border.svg" alt="song" class="icon loader" @click="onClickStop()">
		</div>
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
	padding: 15px;
	opacity: .5;
	transition: all .25s;
	box-sizing: border-box;
	display: flex;
	flex-direction: row;
	align-items: center;

	&>.icon {
		max-height: 45px;
	}

	.stop {
		width: 45px;
		height: 45px;
		min-width: 45px;
		cursor: pointer;
		position: relative;
		
		&:hover {

		}
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
		font-size: 40px;
		font-family: "Arial";
		font-weight: bold;
	}
}
</style>