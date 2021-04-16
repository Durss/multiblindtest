<template>
	<div class="twitchobs" :style="styles">
		<BouncingLoader class="loader" :icon="require('@/assets/icons/home_logo.svg')" v-if="!ready" />
		<router-view name="twitch" class="subView"></router-view>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import SocketEvent from "@/vo/SocketEvent";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
		BouncingLoader,
	}
})
export default class TwitchOBS extends Vue {
	
	public ready:boolean = false;
	public gameStarted:boolean = false;
	public messageHandler:any;
	public zoom:number = 1;

	public get styles():any {
		return {
			fontSize:this.zoom+"em",
		}
	}

	public mounted():void {
		this.ready = true;
		this.messageHandler = (e:SocketEvent) => this.onMessage(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, this.messageHandler);
	}

	public beforeDestroy():void {
		SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, this.messageHandler);
	}

	public onMessage(e:SocketEvent):void {
		if(typeof e.data != "object") return;
		
		switch(e.data.actionType) {
			case TwitchMessageType.PLAYLISTS:
				// console.log("SET PLAYLISTS");
				this.zoom = e.data.state.zoom;
				this.$store.dispatch("setTwitchPlaylists", e.data.state.playlists);
				this.$store.dispatch("setTwitchExpertMode", e.data.state.expert);
				this.$store.dispatch("setTwitchGameState", null);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.ROUND_STATE:
				// console.log("SET ROUND STATE");
				this.zoom = e.data.state.zoomLevel;
				this.$store.dispatch("setTwitchPlaylists", null);
				this.$store.dispatch("setTwitchExpertMode", null);
				this.$store.dispatch("setTwitchGameState", e.data.state);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.LEADERBOARD:
				// console.log("SET LEADERBOARD");
				this.$store.dispatch("setTwitchPlaylists", null);
				this.$store.dispatch("setTwitchExpertMode", null);
				this.$store.dispatch("setTwitchGameState", null);
				this.$store.dispatch("setTwitchLeaderboard", e.data.state);
				this.gameStarted = true;
				break;
			case TwitchMessageType.BROADCASTER_CONTROL:
				// console.log("BROADCASTER_CONTROL");
				break;
			case TwitchMessageType.SET_ZOOM_LEVEL:
				// console.log("SET_ZOOM_LEVEL");
				this.zoom = e.data.zoom
				break;
			case TwitchMessageType.CHANGE_VOLUME:
				console.log("change volumùe", e.data.volume);
				this.$store.dispatch("setVolume", e.data.volume);
				break;
			default:
				console.error("Received a broadcast message with no \"type\" value");
				console.log(e.data);
		}

		// if(this.$route.name == "twitchext/broadcaster") {
		// 	this.redirect();
		// }
	}

}
</script>

<style scoped lang="less">
.twitchobs{
	width: 100vw;
	height: 100vh;
	transition: font-size .3s;

	.subView {
		position: absolute;
		bottom: 5rem;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
	}

	.loader {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		/deep/ .icon {
			top: 12px;
			width: 70px;
			height: 70px;
		}
	}
}
</style>