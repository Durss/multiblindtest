<template>
	<div :class="classes">
		<router-view class="content"/>

		<transition name="slide" appear>
			<Button class="backHome"
				v-if="showHomeButton"
				:to="{name:'home'}"
				:icon="getIcon('home')"
				big
			/>
		</transition>
		<Alert />
		<Tooltip />
		<Confirm />
		<NeedInteractionLayer v-if="storeMain.needUserInteraction" />
		<div :class="socketStatusClasses" v-if="route.meta.needGroupAuth || socketConnected">{{t('global.'+(socketConnected?'online':'offline'))}}</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import Button from './components/Button.vue';
import NeedInteractionLayer from './components/NeedInteractionLayer.vue';
import Tooltip from "./components/Tooltip.vue";
import SockController, { SOCK_ACTIONS } from './sock/SockController';
import { useStoreMain } from "./store";
import { getIcon } from "./utils/Icons";
import Utils from "./utils/Utils";
import Alert from "./views/AlertView.vue";
import Confirm from "./views/Confirm.vue";
import SocketEvent from './vo/SocketEvent';

const { t } = useI18n();
const route = useRoute();
const storeMain = useStoreMain();

let preloadedImages:string[] = [];
const socketConnected = ref<boolean>(false);

const classes = computed(():string[] => {
	let res = ["app"];
	if(storeMain.hideBackground) res.push("noBg");
	return res;
});

const showHomeButton = computed(():boolean => {
	if(route.name == null) return false;
	return Utils.getRouteMetaValue(route, "hideHomeBt") !== true;
});

onMounted(() => {
	//This hacks plays an empty sound on first click to avoid "click to play"
	//layer when starting a multiplayer blindtest and we're not the host
	let handler = (e) => {
		let elem = new Audio();
		elem.loop = false;
		elem.autoplay = false;
		elem.volume = 1;
		elem.setAttribute("src", "/mp3/silence.mp3");
		elem.play();
		document.removeEventListener("click", handler);
	}
	document.addEventListener("click", handler);
	socketConnected.value = SockController.instance.connected;
	SockController.instance.addEventListener(SOCK_ACTIONS.ONLINE, (e)=>onSockStateChange(e));
	SockController.instance.addEventListener(SOCK_ACTIONS.OFFLINE, (e)=>onSockStateChange(e));


	//Preload elements
	const icons = import.meta.glob<string>('@/assets/icons/*', { eager: true, query: '?url', import: 'default' });
	const loader = import.meta.glob<string>('@/assets/loader/*', { eager: true, query: '?url', import: 'default' });
	const images = import.meta.glob<string>('@/assets/images/*', { eager: true, query: '?url', import: 'default' });

	const preloaders = [icons, loader, images];
	for (let i = 0; i < preloaders.length; i++) {
		Object.values(preloaders[i]).forEach((url: string) => {
			preloadedImages.push(url);
			let img = new Image();
			img.src = url;
			/*
			img.addEventListener("error", (e)=> {
				console.error("Loading image failed ! error");
				console.log(url);
				console.log(e);
			})
			img.addEventListener("abort", (e)=> {
				console.error("Loading image failed ! abort");
				console.log(e);
			})
			img.addEventListener("stalled", (e)=> {
				// console.error("Loading image failed ! stalled");
				// console.log(e);
			})
			img.addEventListener("load",(e)=> {
				// console.log("IMAGE OK");
			})
			*/
		});
	}
});

const socketStatusClasses = computed(():string[] => {
	let res = ["sockStatus"];
	if(socketConnected.value) res.push("online");
	return res;
});

function onSockStateChange(e:SocketEvent):void {
	socketConnected.value = e.getType() == SOCK_ACTIONS.ONLINE;
}

</script>

<style scoped lang="less">
@import (reference) 'less/_includes.less';
.app{
	min-height: 100%;
	padding: 20px 0;
	box-sizing: border-box;
	background-color: @mainColor_normal_extralight;

	&.noBg {
		background-color: rgba(0, 0, 0, 0);
		padding: 0;
		overflow: hidden;

		.content {
			max-width: none;
		}
	}

	.content {
		max-width: 500px;
		margin: auto;
	}

	.button.backHome {
		position: fixed;
		top: 0;
		left: 0;
		border-radius: 0;
		border-bottom-right-radius: 50%;
		z-index: 1;

		&.slide-enter-active, &.slide-leave-active {
			transition: all .5s;
			transform: translate(0, 0);
		}
		&.slide-enter-from, &.slide-leave-to {
			transform: translate(-100%, -100%);
		}
	}

	.sockStatus {
		position: fixed;
		bottom: 2px;
		left: 2px;
		opacity: .25;
		font-size: 12px;
		color: black;
		// text-shadow: rgba(0,0,0,.25) 0px 0px 1px;
		&::before {
			content: "";
			background: red;
			border-radius: 50%;
			width: 5px;
			height: 5px;
			display: inline-block;
			vertical-align: middle;
			margin-right: 5px;
		}
		&.online {
			&::before {
				background: green;
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.app{
		.content {
			width: 90%;
		}
	}
}
</style>