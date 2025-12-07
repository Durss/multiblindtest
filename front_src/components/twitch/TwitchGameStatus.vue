<template>
	<div class="TwitchGameStatus">
		<transition name="fadeIn">
			<div class="title" v-if="playlists.length > 0">
				<!-- <h1>Game will start soon</h1> -->
				<img src="@/assets/icons/home_logo_outlined.svg" alt="logo" class="logo">
				<div v-if="expertMode" class="expertMode">
					<div class="head"><img src="@/assets/icons/flex_left.svg"> Expert mode <img src="@/assets/icons/flex_right.svg"></div>
					<div :class="titleClasses">{{$t('group.game.expertMode.'+(titleAccepted? 'accept': 'refuse')+'Title')}}</div>
					<div :class="artistClasses">{{$t('group.game.expertMode.'+(artistAccepted? 'accept': 'refuse')+'Artist')}}</div>
				</div>
			</div>
		</transition>
		
		<Button v-if="playlists.length > 0 && !obsMode" title="Join the game" type="checkbox" v-model="iwannaplay" class="joinBt" big white />
		
		<div class="playlistsHolder">
			<div class="playlistsTitle">{{$tc('twitch.viewer.selectedPlaylists', playlists.length)}}</div>
			<transition-group tag="div" class="playlists"
			v-bind:css="false"
			v-on:before-enter="beforeEnter"
			v-on:enter="enter"
			v-on:leave="leave">
				<div v-for="(p,index) in playlists" :key="p.id" class="playlist" :data-index="index">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</transition-group>
		</div>
	</div>
</template>

<script lang="ts">
import Utils from "@/utils/Utils";
import gsap from "gsap";
import { Component, Vue, Watch } from "vue-property-decorator";
import Button from "../Button.vue";

@Component({
	components:{
		Button,
	}
})
export default class TwitchGameStatus extends Vue {

	public iwannaplay:boolean = false;

	public get expertMode():boolean {
		return this.$store.state.twitchExpertMode != null && this.$store.state.twitchExpertMode.length > 0;
	}

	public get playlists():{name:string,cover:string,id:string}[] {
		let list:any[] = JSON.parse(JSON.stringify(this.$store.state.twitchPlaylists));
		if(!list) return [];
		return list;
	}

	public get titleClasses():string[] {
		let res = ["type"];
		if(this.expertMode && this.titleAccepted) res.push("active");
		return res;
	}
	public get titleAccepted():boolean { return this.$store.state.twitchExpertMode.indexOf("title") > -1; }

	public get artistClasses():string[] {
		let res = ["type"];
		if(this.expertMode && this.artistAccepted) res.push("active");
		return res;
	}
	public get artistAccepted():boolean { return this.$store.state.twitchExpertMode.indexOf("artist") > -1; }

	public get obsMode():boolean {
		return Utils.getRouteMetaValue(this.$route, "obsMode") === true;
	}

	public mounted():void {
		this.onPlayChange();
	}

	public beforeDestroy():void {
	}

	public beforeEnter(el:Element):void {
		gsap.set(el, {opacity:1});
	}

	public enter(el:Element):void {
		let index = parseInt((el as HTMLElement).dataset.index) + 1;
		gsap.from(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
	}

	public leave(el:Element):void {
		let index = parseInt((el as HTMLElement).dataset.index);
		gsap.to(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
	}

	@Watch("iwannaplay")
	public onPlayChange():void {
		this.$store.dispatch("setVolume", this.iwannaplay? .5 : 0);
	}
}
</script>

<style scoped lang="less">
.TwitchGameStatus{
	
	.fadeIn-enter-active, .fadeIn-leave-active {
		opacity: 1;
		transition: opacity 1.5s;
	}
	.fadeIn-enter, .fadeIn-leave-to {
		opacity: 0;
	}

	.title {
		text-align: center;
		margin-bottom: .55em;

		.expertMode {
			background-color: @mainColor_warn;
			color: white;
			font-weight: bold;
			padding: .3em;
			border-radius: .5em;
			width: min-content;
			margin: auto;
			margin-top: .4em;
			.head {
				white-space: nowrap;
				font-size: 1.5em;
				img {
					height: .7em;
					vertical-align: middle;
				}
			}
			.type {
				white-space: nowrap;
				color: @mainColor_alert;
				&::before {
					content: "";
					width: .75em;
					height: .65em;
					display: inline-block;
					margin-right: 5px;
					background-position: right center;
					background-repeat: no-repeat;
					background-image: url("../../assets/icons/cross.svg");
				}
				&.active {
					color: white;
					&::before {
						width: .75em;
						height: .75em;
						background-image: url("../../assets/icons/checkmark_white.svg");
					}
				}
			}
		}
	}

	.logo {
		height: 7em;
	}

	.joinBt {
		background-color: @mainColor_warn!important;
		padding: .8em !important;
		border-radius: 1em;

		&:hover {
			background-color: @mainColor_warn!important;
		}
	}

	.playlistsHolder {
		background-color: @mainColor_normal!important;
		padding: .8em;
		border-radius: 1em;
		margin-top: 10px;
		max-width: 80vw;
		.playlistsTitle {
			font-size: 1.5em;
			color: #fff;
			font-weight: bold;
			font-family: "Futura";
			margin-bottom: .5em;
		}
	
		.playlists {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			.playlist {
				position: relative;
				background-color: #fff;
				border-radius: 100px;
				display: flex;
				flex-direction: row;
				align-items: center;
				padding: .1em .5em .1em .1em;
				box-sizing: border-box;
				width: min-content;
				white-space: nowrap;
				max-width: 100%;
				margin-bottom: .5em;
				&:not(:last-child) {
					margin-right: .5em;
				}
				.label {
					color: @mainColor_normal;
					margin-left: .3em;
					font-size: 1em;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.cover {
					width: 2em;
					height: 2em;
					border-radius: 50%;
					object-fit: cover;
				}
			}
		}
	}
}
</style>