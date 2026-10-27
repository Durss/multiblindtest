<template>
	<div class="TwitchGameStatus">
		<transition name="fadeIn">
			<div class="title" v-if="playlists.length > 0">
				<!-- <h1>Game will start soon</h1> -->
				<img src="@/assets/icons/home_logo_outlined.svg" alt="logo" class="logo">
				<div v-if="expertMode" class="expertMode">
					<div class="head"><img src="@/assets/icons/flex_left.svg"> {{t('group.lobby.expertMode.title')}} <img src="@/assets/icons/flex_right.svg"></div>
					<div :class="titleClasses">{{t('group.game.expertMode.'+(titleAccepted? 'accept': 'refuse')+'Title')}}</div>
					<div :class="artistClasses">{{t('group.game.expertMode.'+(artistAccepted? 'accept': 'refuse')+'Artist')}}</div>
				</div>
			</div>
		</transition>

		<Button v-if="playlists.length > 0 && !obsMode" :title="t('group.lobby.join')" type="checkbox" v-model="iwannaplay" class="joinBt" big white />

		<div class="playlistsHolder">
			<div class="playlistsTitle">{{t('twitch.viewer.selectedPlaylists', playlists.length)}}</div>
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
<script setup lang="ts">
import { useStoreMain } from "@/store";
import Utils from "@/utils/Utils";
import gsap from "gsap";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import Button from "../Button.vue";

const { t } = useI18n();
const route = useRoute();
const storeMain = useStoreMain();

const iwannaplay = ref<boolean>(false);

const expertMode = computed(():boolean => {
	return storeMain.twitchExpertMode != null && storeMain.twitchExpertMode.length > 0;
});

const playlists = computed(():{name:string,cover:string,id:string}[] => {
	let list:any[] = JSON.parse(JSON.stringify(storeMain.twitchPlaylists));
	if(!list) return [];
	return list;
});

const titleClasses = computed(():string[] => {
	let res = ["type"];
	if(expertMode.value && titleAccepted.value) res.push("active");
	return res;
});
const titleAccepted = computed(():boolean => { return storeMain.twitchExpertMode.indexOf("title") > -1; });

const artistClasses = computed(():string[] => {
	let res = ["type"];
	if(expertMode.value && artistAccepted.value) res.push("active");
	return res;
});
const artistAccepted = computed(():boolean => { return storeMain.twitchExpertMode.indexOf("artist") > -1; });

const obsMode = computed(():boolean => {
	return Utils.getRouteMetaValue(route, "obsMode") === true;
});

onMounted(() => {
	onPlayChange();
});

function beforeEnter(el:Element):void {
	gsap.set(el, {opacity:1});
}

function enter(el:Element):void {
	let index = parseInt((el as HTMLElement).dataset.index) + 1;
	gsap.from(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
}

function leave(el:Element):void {
	let index = parseInt((el as HTMLElement).dataset.index);
	gsap.to(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
}

watch(iwannaplay, () => onPlayChange());

function onPlayChange():void {
	storeMain.setVolume(iwannaplay.value? .5 : 0);
}

</script>

<style scoped lang="less">
.TwitchGameStatus{
	
	.fadeIn-enter-active, .fadeIn-leave-active {
		opacity: 1;
		transition: opacity 1.5s;
	}
	.fadeIn-enter-from, .fadeIn-leave-to {
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