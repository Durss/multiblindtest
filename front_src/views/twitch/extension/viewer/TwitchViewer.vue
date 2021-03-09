<template>
	<div class="twitchviewer">
		<TwitchGameStatus v-if="section == 'playlists'" />
		<TwitchViewerGame v-if="section == 'game'" />
		<TwitchViewerLeaderboard v-if="section == 'leaderboard'" />
		<TwitchViewerControls :section="section" class="controls" v-if="isBroadcaster" />
	</div>
</template>

<script lang="ts">
import TwitchGameStatus from "@/components/twitch/TwitchGameStatus.vue";
import SockController from "@/sock/SockController";
import Utils from "@/utils/Utils";
import { Component, Vue } from "vue-property-decorator";
import TwitchViewerControls from "./TwitchViewerControls.vue";
import TwitchViewerGame from "./TwitchViewerGame.vue";
import TwitchViewerLeaderboard from "./TwitchViewerLeaderboard.vue";

@Component({
	components:{
		TwitchGameStatus,
		TwitchViewerGame,
		TwitchViewerControls,
		TwitchViewerLeaderboard,
	}
})
export default class TwitchViewer extends Vue {

	public get section():string {
		let section = null;
		if(this.$store.state.twitchLeaderboard) section = "leaderboard";
		else if(this.$store.state.twitchGameState) section = "game";
		else if(this.$store.state.twitchPlaylists) section = "playlists";
		return section;
	}

	//Only available for twitch extension to display controls within the
	//extension of the broadcaster. Useless for OBS mode as the OBS browser
	//interaction is hell.
	public get isBroadcaster():boolean {
		//Can't use @Prop(). Doesn't work with nested routes -_-
		return this.$route.params.isBroadcaster == "1";
	}

	public get twitchLogin():string {
		//Can't use @Prop(). Doesn't work with nested routes -_-
		return this.$route.params.twitchLogin;
	}

	public mounted():void {
		this.$store.dispatch("setHideBackground", true);
		if(Utils.getRouteMetaValue(this.$route, "obsMode")) {
			SockController.instance.connect();
			SockController.instance.user = {
												name:"controler",
												id:this.twitchLogin+"_ext",
												offline:false,
												score:0,
												handicap:0,
											};
		}
	}

	public beforeDestroy():void {
	}

}
</script>

<style scoped lang="less">
.twitchviewer{
	text-align: center;

	.controls {
		position: absolute;
		left: 0;
		bottom: 0;
	}
}
</style>