<template>
	<div class="twitchviewer">
		<TwitchGameStatus v-if="section == 'playlists'" />
		<TwitchViewerGame v-if="section == 'game'" />
		<TwitchViewerLeaderboard v-if="section == 'leaderboard'" />
	</div>
</template>

<script lang="ts">
import TwitchGameStatus from "@/components/twitch/TwitchGameStatus.vue";
import { Component, Vue } from "vue-property-decorator";
import TwitchViewerGame from "./TwitchViewerGame.vue";
import TwitchViewerLeaderboard from "./TwitchViewerLeaderboard.vue";

@Component({
	components:{
		TwitchGameStatus,
		TwitchViewerGame,
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

	public mounted():void {
		
	}

	public beforeDestroy():void {
	}

}
</script>

<style scoped lang="less">
.twitchviewer{
	text-align: center;
}
</style>