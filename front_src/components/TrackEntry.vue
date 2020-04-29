<template>
	<div :class="classes">
		<div class="icon">
			<img v-if="(!reveal || !data.guessedBy) && !data.loadFail" src="@/assets/icons/song.svg" alt="song" class="icon">
			<div v-if="reveal && data.guessedBy && !data.loadFail" class="score">{{score}}</div>
			<img v-if="data.loadFail" src="@/assets/icons/cross_white.svg" alt="error" class="icon">
		</div>
		
		<div v-if="reveal" class="trackInfos">
			<div class="artist">{{data.artist}}</div>
			<div class="name">{{data.name}}</div>
		</div>
		
		<div v-if="data.loadFail" class="trackInfos">
			<div class="artist">{{$t("game.loadError")}}</div>
			<div class="name">{{data.artist}} - {{data.name}}</div>
		</div>
		
		<p v-if="!reveal && !data.loadFail" class="placeholder">{{$t('game.hidden')}}</p>

		<div class="stop" v-if="reveal && canStop" :data-tooltip="$t('game.stopTrack')">
			<img src="@/assets/icons/stop.svg" alt="song" class="icon" @click="$emit('stop', data)">
			<img src="@/assets/loader/loader_border.svg" alt="song" class="icon loader" @click="onClickStop()">
		</div>

		<div class="guesser" v-if="data.guessedBy">
			<p class="pseudo">{{data.guessedBy.name}}</p>
			<!-- <p class="plus">+</p>
			<p class="score">{{score}}</p> -->
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import TrackData from '@/vo/TrackData';
import ScoreHistory from '../vo/ScoreHistory';

@Component({
	components:{}
})
export default class TrackEntry extends Vue {

	@Prop()
	public data:TrackData;

	@Prop()
	public scoreHistory:ScoreHistory[];

	@Prop({default:false})
	public forceReveal:boolean;
	
	public canStop:boolean = false;

	public get classes():string[] {
		let res = ["trackentry"];
		if(this.reveal) res.push("enabled");
		if(this.data.loadFail) res.push("error");
		if(this.forceReveal && !this.data.enabled) res.push("forcedReveal");
		return res;
	}

	public get reveal():boolean {
		return this.data.enabled || this.forceReveal;
	}

	public get score():number {
		if(!this.scoreHistory) return null;
		for (let i = this.scoreHistory.length-1; i > -1; i--) {
			const s = this.scoreHistory[i];
			if(s.trackId == this.data.id) return s.score;
		}
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
		width: 50px;
		height: 50px;
		.icon {
			height: 100%;
			width: 100%;
		}

		.score {
			font-family: "Futura";
			font-weight: bold;
			border-radius: 50px;
			font-size: 25px;
			color: @mainColor_warn;
			background-image: url("../assets/icons/star.svg");
			background-repeat: no-repeat;
			display: block;
			width: 60px;
			height: 60px;
			margin-left: -5px;
			margin-top: -8px;
			padding: 21px 0;

			&::before {
				content: "+";
				margin-left: -9px;
				font-size: 18px;
				vertical-align: top;
			}
		}
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

	&.forcedReveal {
		// filter: saturate(25%);
		opacity: .5;
		font-style: italic;
		color: fade(#fff, 60%);
		.icon{
			opacity: .6;
		}
	}

	&.error {
		background-color: #c00;
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
		transform: translate(10px, 25%);
		display: flex;
		flex-direction: row;
		align-items: center;
		font-family: "Futura";

		.pseudo {
			padding: 5px 10px;
			border-radius: 20px;
			background-color: @mainColor_warn;
		}
	}
}

@media only screen and (max-width: 500px) {
	.trackentry {

		padding: 7px;
		&>.icon {
			max-height: 20px;

			.score {
				font-size: 16px;
				width: 40px;
				height: auto;
				margin-left: 0px;
				margin-top: -10px;
				padding: 13px 0;

				&::before {
					margin-left: -5px;
					font-size: 13px;
				}
			}
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