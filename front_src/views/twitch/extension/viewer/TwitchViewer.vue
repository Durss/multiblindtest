<template>
	<div class="twitchviewer">
		<TwitchGameStatus v-if="section == 'playlists'" />
		<TwitchViewerGame v-if="section == 'game'" />
		<TwitchViewerLeaderboard v-if="section == 'leaderboard'" />
		<TwitchViewerControls :section="section" class="controls" v-if="isBroadcaster" />
	</div>
</template>
<script setup lang="ts">
import TwitchGameStatus from "@/components/twitch/TwitchGameStatus.vue";
import SockController from "@/sock/SockController";
import { useStoreMain } from "@/store";
import Utils from "@/utils/Utils";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import TwitchViewerControls from "./TwitchViewerControls.vue";
import TwitchViewerGame from "./TwitchViewerGame.vue";
import TwitchViewerLeaderboard from "./TwitchViewerLeaderboard.vue";

const route = useRoute();
const storeMain = useStoreMain();

const section = computed(():string => {
	let section = null;
	if(storeMain.twitchLeaderboard) section = "leaderboard";
	else if(storeMain.twitchGameState) section = "game";
	else if(storeMain.twitchPlaylists) section = "playlists";
	return section;
});

//Only available for twitch extension to display controls within the
//extension of the broadcaster. Useless for OBS mode as the OBS browser
//interaction is hell.
const isBroadcaster = computed(():boolean => {
	//Read from route, params of nested named views aren't passed as props
	return route.params.isBroadcaster == "1";
});

const twitchLogin = computed(():string => {
	//Read from route, params of nested named views aren't passed as props
	return route.params.twitchLogin as string;
});

onMounted(() => {
	storeMain.hideBackground = true;
	if(Utils.getRouteMetaValue(route, "obsMode")) {
		SockController.instance.connect();
		SockController.instance.user = {
											name:"controler",
											id:twitchLogin.value+"_ext",
											offline:false,
											score:0,
											handicap:0,
										};
	}
});

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