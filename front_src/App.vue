<template>
	<div class="app">
		<router-view class="content"/>
		<transition name="slide" appear>
			<Button class="backHome"
				v-if="$route.meta.hideHomeBt!==true"
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
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Tooltip from "./components/Tooltip.vue";
import Confirm from "./views/Confirm.vue";
import Alert from "./views/AlertView.vue";
import Button from './components/Button.vue';
import SockController, { SOCK_ACTIONS } from './sock/SockController';
import SocketEvent from './vo/SocketEvent';
import NeedInteractionLayer from './components/NeedInteractionLayer.vue';

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

	private socketConnected:boolean = false;

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
		SockController.instance.addEventListener(SOCK_ACTIONS.ONLINE, (e)=>this.onSockStateChange(e))
		SockController.instance.addEventListener(SOCK_ACTIONS.OFFLINE, (e)=>this.onSockStateChange(e))
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
	.content {
		max-width: 500px;
		margin: auto;
		padding: 20px 0;
	}

	.button.backHome {
		position: fixed;
		top: 0;
		left: 0;
		border-radius: 0;
		border-bottom-right-radius: 50%;

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
		right: 2px;
		opacity: .25;
		font-size: 12px;
		color: black;
		// text-shadow: rgba(0,0,0,.25) 0px 0px 1px;
		&::after {
			content: "";
			background: red;
			border-radius: 50%;
			width: 5px;
			height: 5px;
			display: inline-block;
			vertical-align: middle;
			margin-left: 5px;
		}
		&.online {
			&::after {
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