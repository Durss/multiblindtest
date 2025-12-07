<template>
	<div :class="classes" @click.ctrl="showJSONBt = !showJSONBt">
		<div class="icon">
			<img v-if="(!reveal || !data.guessedBy || data.guessedBy.length == 0) && !data.loadFail" src="@/assets/icons/song.svg" alt="song" class="icon">
			<div v-if="reveal && data.guessedBy && data.guessedBy.length > 0 && !data.loadFail" class="score">{{data.score}}</div>
			<img v-if="data.loadFail" src="@/assets/icons/cross_white.svg" alt="error" class="icon">
		</div>
		
		<div v-if="reveal" class="trackInfos">
			<div class="album" v-if="acceptAlbum">
				<img src="@/assets/icons/playlist.svg" class="icon" alt="album">
				<span>{{data.album}}</span>
			</div>
			<div class="artist">
				<img src="@/assets/icons/user_white.svg" class="icon" alt="artist">
				<span>{{data.artist}}</span>
			</div>
			<div class="title">
				<img src="@/assets/icons/music.svg" class="icon" alt="title">
				<span>{{data.name}}</span>
			</div>
		</div>
		
		<div v-if="data.loadFail" class="trackInfos">
			<div class="artist">{{$t("game.loadError")}}</div>
			<div class="name">{{data.artist}} - {{data.name}}</div>
		</div>
		
		<p v-if="!reveal && !data.loadFail" class="placeholder">{{$t('game.hidden')}}</p>

		<div class="stop" v-if="reveal && canReplay">
			<img src="@/assets/icons/play_withBg.svg" alt="song" class="icon" @click="onClickPlay()" v-if="!playing">
			<img src="@/assets/icons/stop.svg" alt="song" class="icon" @click="onClickStop()" v-if="playing">
		</div>

		<div class="guesser" v-if="reveal && data.guessedBy && data.guessedBy.length > 0">
			<p class="pseudo" v-for="u in data.guessedBy" :key="'guess_'+u.name+'_'+u.id">{{u.name}}</p>
		</div>

		<div ref="stars" class="stars">
			<img src="@/assets/icons/star.svg" alt="star" ref="star" v-for="i in 30" :key="i">
		</div>

		<Button data-tooltip="Copy JSON to clipboard" v-if="showJSONBt" class="copyJSON small" @click="copyJSON()" title="JSON" :icon="copyIcon" />
	</div>
</template>

<script lang="ts">
import Utils from "@/utils/Utils";
import TrackData from '@/vo/TrackData';
import gsap from "gsap";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Button from "./Button.vue";

@Component({
	components:{
		Button,
	}
})
export default class TrackEntry extends Vue {

	public get copyIcon():string { return this.$getIcon('copy'); }

	@Prop()
	public data:TrackData;

	@Prop({default:false})
	public forceReveal:boolean;

	@Prop({default:false})
	public small:boolean;

	@Prop({default:true})
	public canReplay:boolean;

	@Prop({default:false})
	public burstStars:boolean;

	@Prop({default:false})
	public acceptAlbum:boolean;
	
	public playing:boolean = false;
	public showJSONBt:boolean = false;

	public get classes():string[] {
		let res = ["trackentry"];
		if(this.small !== false) res.push("small");
		if(this.reveal) res.push("enabled");
		if(this.data.loadFail) res.push("error");
		if(this.forceReveal && !this.data.enabled) res.push("forcedReveal");
		if(this.data.highlight === true) res.push("highlight");
		return res;
	}

	public get reveal():boolean {
		return this.data.enabled || this.forceReveal;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public allowManualStop():void {
		this.canReplay = true;
		this.playing = true;
	}

	public onClickStop():void {
		this.$emit('stop', this.data);
		this.playing = false;
	}

	public onClickPlay():void {
		this.playing = true;
		this.$emit('play', this.data);
	}

	@Watch("data.enabled")
	public onRevealChange():void {
		if(this.burstStars && this.data.enabled) {
			this.burstParticles();
		}
	}

	public burstParticles():void {
		let stars = <Element[]>this.$refs.star;
		let bounds = this.$el.getBoundingClientRect();
		for (let i = 0; i < stars.length; i++) {
			const s = stars[i];
			gsap.killTweensOf(s);
			let px = Math.random() * bounds.width - 30;
			let py = Math.random() * bounds.height - 30;
			gsap.set(s, {opacity:1, x:px, y:py, scale:Math.random()*1 + .5});
			gsap.to(s, {opacity:0,
						rotation:(Math.random()-Math.random()) * Math.PI * 2.5+"rad",
						x:px + (Math.random()-Math.random()) * 200,
						y:py + (Math.random()-Math.random()) * 100,
						scale:0,
						duration:1.25});
		}
		setTimeout(_=> {
			//Reset stars to avoid page overflow on small screens
			for (let i = 0; i < stars.length; i++) {
				const s = stars[i];
				gsap.set(s, {opacity:1, x:0, y:0, scale:0});
			}
		},1500)
	}

	public copyJSON():void {
		Utils.copyToClipboard(JSON.stringify(this.data));
	}

}
</script>

<style scoped lang="less">
.trackentry{
	background-color: @mainColor_normal;
	color: #fff;
	// max-width: 500px;
	border-radius: 2em;
	text-align: center;
	padding: .55em;
	opacity: .5;
	transition: all .25s;
	box-sizing: border-box;
	display: flex;
	flex-direction: row;
	align-items: center;
	position: relative;

	&>.icon {
		width: 3em;
		height: 3em;
		min-width: 3em;
		min-height: 3em;
		.icon {
			height: 100%;
			width: 100%;
		}

		.score {
			font-family: "Futura";
			font-weight: bold;
			font-size: 1.5em;
			color: @mainColor_warn;
			background-image: url("../assets/icons/star.svg");
			background-repeat: no-repeat;
			display: block;
			width: 2.5em;
			height: 2.5em;
			margin-left: -.1em;
			margin-top: -.3em;
			padding: .9em 0;

			&::before {
				content: "+";
				margin-left: -.3em;
				font-size: .7em;
				vertical-align: top;
			}
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

	&.highlight {
		background-color: @mainColor_warn;
	}

	&.error {
		background-color: #c00;
	}

	&.small {
		&>.icon {
			width: 2em;
			height: 2em;
			min-width: 2em;
			min-height: 2em;
		}

		.trackInfos {
			font-size: 1em;
			.title {
				font-size: .8em;
			}
			.artist {
				margin-bottom: .3em;
			}
			.album {
				margin-bottom: .3em;
			}
		}

		.placeholder {
			font-size: 1.2em;
		}

		.score {
			font-size: 1.4em;
			width: 2em;
			height: 2em;
			padding: .6em 0;
		}

		.guesser {
			transform: translate(.5em, 50%);
			.pseudo {
				font-size: .85em;
			}
		}

		.stop {
			width: 2em;
			height: 2em;
			min-width: 2em;
		}
	}

	.trackInfos {
		font-size: 1.15em;
		flex-grow: 1;
		.artist {
			font-weight: bold;
			margin-bottom: .25em;
		}
		.title {
			.icon {
				height: 22px;
			}
		}
		.artist {
			margin-bottom: .3em;
		}
		.album {
			margin-bottom: .3em;
		}
		*> {
			.icon {
				height: 30px;
				margin-right: 7px;
				vertical-align: bottom;
			}
		}
	}

	.placeholder {
		flex-grow: 1;
		font-size: 2em;
		font-family: "Arial";
		font-weight: bold;
	}

	.guesser {
		position: absolute;
		right: 0;
		bottom: 0;
		transform: translate(.7em, 25%);
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		font-family: "Futura";
		z-index: 1;
		flex-wrap: wrap;
		max-width: 100%;
		max-height: 1.5em;
		overflow: auto;

		.pseudo {
			font-size: 1em;
			padding: .25em .5em;
			border-radius: 2em;
			background-color: @mainColor_warn;
			&:not(:first-child) {
				font-size: .9em;
				padding: .1em .25em;
				background-color: fade(@mainColor_warn, 85%);
			}
		}
	}

	.stars {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		img {
			opacity: 0;
			position: absolute;
			width: 2em;
			height: 2em;
			transform-origin: center center;
		}
	}

	.stop {
		width: 3em;
		height: 3em;
		min-width: 3em;
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
}
</style>