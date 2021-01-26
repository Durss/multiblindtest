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
		if(this.$store.state.twitchLeaderboard) return "leaderboard";
		if(this.$store.state.twitchGameState) return "game";
		if(this.$store.state.twitchPlaylists) return "playlists";
		return null;
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