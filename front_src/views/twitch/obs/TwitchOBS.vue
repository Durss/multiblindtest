<template>
	<div class="twitchobs">
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

	public mounted():void {
		this.ready = true;
		console.log("OK");
		this.messageHandler = (e:SocketEvent) => this.onMessage(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, this.messageHandler);
	}

	public beforeDestroy():void {
		SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, this.messageHandler);
	}

	public onMessage(e:SocketEvent):void {
		// console.log("SOCKET EVENT");
		// console.log(e);
		// console.log(e.data.actionType);
		// console.log(typeof e.data);
		if(typeof e.data != "object") return;
		
		switch(e.data.actionType) {
			case TwitchMessageType.PLAYLISTS:
				console.log("SET PLAYLISTS");
				this.$store.dispatch("setTwitchPlaylists", e.data.playlists);
				this.$store.dispatch("setTwitchExpertMode", e.data.expert);
				this.$store.dispatch("setTwitchGameState", null);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.ROUND_STATE:
				console.log("SET ROUND STATE");
				this.$store.dispatch("setTwitchPlaylists", null);
				this.$store.dispatch("setTwitchExpertMode", null);
				this.$store.dispatch("setTwitchGameState", e.data.state);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.LEADERBOARD:
				console.log("SET LEADERBOARD");
				this.$store.dispatch("setTwitchPlaylists", null);
				this.$store.dispatch("setTwitchExpertMode", null);
				this.$store.dispatch("setTwitchGameState", null);
				this.$store.dispatch("setTwitchLeaderboard", e.data.state);
				this.gameStarted = true;
				break;
			case TwitchMessageType.BROADCASTER_CONTROL:
				console.log("BROADCASTER_CONTROL");
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
	
}
</style>