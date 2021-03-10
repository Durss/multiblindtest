<template>
	<div :class="classes">
		<router-view class="content"/>
		
		<transition name="slide" appear>
			<Button class="backHome"
				v-if="showHomeButton"
				:to="{name:'home'}"
				:icon="require('@/assets/icons/home.svg')"
				big
			/>
		</transition>
		<Alert />
		<Tooltip />
		<Confirm />
		<NeedInteractionLayer v-if="$store.state.needUserInteraction" />
		<div :class="socketStatusClasses" v-if="$route.meta.needGroupAuth || socketConnected">{{$t('global.'+(socketConnected?'online':'offline'))}}</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Button from './components/Button.vue';
import NeedInteractionLayer from './components/NeedInteractionLayer.vue';
import Tooltip from "./components/Tooltip.vue";
import SockController, { SOCK_ACTIONS } from './sock/SockController';
import Utils from "./utils/Utils";
import Alert from "./views/AlertView.vue";
import Confirm from "./views/Confirm.vue";
import SocketEvent from './vo/SocketEvent';

@Component({
	components:{
		Alert,
		Tooltip,
		Confirm,
		Button,
		NeedInteractionLayer,
	}
})
export default class App extends Vue {

	private preloadedImages:string[] = [];
	private socketConnected:boolean = false;

	public get classes():string[] {
		let res = ["app"];
		if(this.$store.state.hideBackground) res.push("noBg");
		return res;
	}

	public get showHomeButton():boolean {
		if(this.$route.name == null) return false;
		return Utils.getRouteMetaValue(this.$route, "hideHomeBt") !== true;
	}

	public mounted():void {
		//This hacks plays an empty sound on first click to avoid "click to play"
		//layer when starting a multiplyer blindtest and we're not the host
		let handler = (e) => {
			let elem = new Audio();
			elem.loop = true;
			elem.autoplay = false;
			elem.volume = 1;
			elem.setAttribute("src", "/mp3/silence.mp3");
			elem.play();
			document.removeEventListener("click", handler);
		}
		document.addEventListener("click", handler);
		this.socketConnected = SockController.instance.connected;
		SockController.instance.addEventListener(SOCK_ACTIONS.ONLINE, (e)=>this.onSockStateChange(e));
		SockController.instance.addEventListener(SOCK_ACTIONS.OFFLINE, (e)=>this.onSockStateChange(e));
		
		
		//Preload elements
		let preloaders = [require.context("@/assets/icons/"), require.context("@/assets/loader/"), require.context("@/assets/images/")];
		for (let i = 0; i < preloaders.length; i++) {
			preloaders[i].keys().forEach(img => {
				this.preloadedImages.push(preloaders[i](img));
				let loader = new Image();
				loader.src = preloaders[i](img);
				/*
				loader.addEventListener("error", (e)=> {
					console.error("Loading image failed ! error");
					console.log(img);
					console.log(e);
				})
				loader.addEventListener("abort", (e)=> {
					console.error("Loading image failed ! abort");
					console.log(e);
				})
				loader.addEventListener("stalled", (e)=> {
					// console.error("Loading image failed ! stalled");
					// console.log(e);
				})
				loader.addEventListener("load",(e)=> {
					// console.log("IMAGE OK");
				})
				*/
			});
		}
	}

	public beforeDestroy():void {
		
	}

	public get socketStatusClasses():string[] {
		let res = ["sockStatus"];
		if(this.socketConnected) res.push("online");
		return res;
	}

	private onSockStateChange(e:SocketEvent):void {
		this.socketConnected = e.getType() == SOCK_ACTIONS.ONLINE;
	}

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
		&.slide-enter, &.slide-leave-to {
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