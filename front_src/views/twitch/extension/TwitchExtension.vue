<template>
	<div class="twitchextension">
		<div class="frameholder">
			<BouncingLoader class="loader" :icon="require('@/assets/icons/home_logo.svg')" v-if="!ready" />
			<router-view name="twitch" class="subView"></router-view>
		</div>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import TwitchExtensionEvent from "@/twitch/TwitchExtensionEvent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
		BouncingLoader,
	}
})
export default class TwitchExtension extends Vue {

	public isBroadcaster:boolean = false;
	public ready:boolean = false;
	public gameStarted:boolean = false;
	private messageHandler:any;

	public get url():string {
		return this.$router.resolve({name:"twitch/auth"}).href.replace("#", "");
	}

	public async mounted():Promise<void> {
		this.$store.dispatch("setHideBackground", true);
		
		if(TwitchExtensionHelper.instance.connected) {
			this.onConnected();
		}else{
			await TwitchExtensionHelper.instance.onConnect();
			this.onConnected();
		}
		this.messageHandler = (e:TwitchExtensionEvent) => this.onMessage(e);
		TwitchExtensionHelper.instance.addEventListener(TwitchExtensionEvent.MESSAGE, this.messageHandler);
	}

	public beforeDestroy():void {
		TwitchExtensionHelper.instance.removeEventListener(TwitchExtensionEvent.MESSAGE, this.messageHandler);
	}

	private onConnected():void {
		this.ready = true;
		
		if(this.$route.name != "twitchext") return;

		this.redirect();
	}

	private redirect():void {
		let isBroadcaster = TwitchExtensionHelper.instance.isBroadcaster;
		if(isBroadcaster && !this.gameStarted) {
			this.$router.push({name:"twitchext/broadcaster"});
		}else{
			this.$router.push({name:"twitchext/viewer", params:{isBroadcaster:isBroadcaster?"1":"0"}});
		}
	}

	public onMessage(e:TwitchExtensionEvent):void {
		if(typeof e.data != "object") return;
		
		switch(e.data.type) {
			case TwitchMessageType.PLAYLISTS:
				this.$store.dispatch("setTwitchPlaylists", e.data.playlists);
				this.$store.dispatch("setTwitchExpertMode", e.data.expert);
				this.$store.dispatch("setTwitchGameState", null);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.ROUND_STATE:
				this.$store.dispatch("setTwitchPlaylists", null);
				this.$store.dispatch("setTwitchExpertMode", null);
				this.$store.dispatch("setTwitchGameState", e.data.state);
				this.$store.dispatch("setTwitchLeaderboard", null);
				this.gameStarted = true;
				break;
			case TwitchMessageType.LEADERBOARD:
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

		if(this.$route.name == "twitchext/broadcaster") {
			this.redirect();
		}
	}

}
</script>

<style scoped lang="less">
.twitchextension{
	&>.frameholder {
		position: absolute;
		top: 5rem;
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