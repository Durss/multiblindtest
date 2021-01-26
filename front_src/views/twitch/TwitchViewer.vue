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
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import { Component, Prop, Vue } from "vue-property-decorator";
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

	public iwannaplay:boolean = false;

	public get section():string {
		let section = null;
		if(this.$store.state.twitchLeaderboard) section = "leaderboard";
		else if(this.$store.state.twitchGameState) section = "game";
		else if(this.$store.state.twitchPlaylists) section = "playlists";
		return section;
	}

	public get isBroadcaster():boolean {
		return this.$route.params.isBroadcaster == "1";
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
	}

	public test():void {
		TwitchExtensionHelper.instance.broadcast(TwitchMessageType.BROADCASTER_CONTROL, {couille:"VERGE EN FEUUUUUUUUUU DE DIEUUUUUUUUU"});
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