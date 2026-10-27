<template>
	<div class="twitchobs" :style="styles">
		<BouncingLoader class="loader" :icon="getIcon('home_logo')" v-if="!ready" />
		<router-view name="twitch" class="subView"></router-view>
	</div>
</template>
<script setup lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import { useStoreMain } from "@/store";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import { getIcon } from "@/utils/Icons";
import SocketEvent from "@/vo/SocketEvent";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const storeMain = useStoreMain();

const ready = ref<boolean>(false);
let gameStarted:boolean = false;
let messageHandler:any;
const zoom = ref<number>(1);

const styles = computed(():any => {
	return {
		fontSize:zoom.value+"em",
	}
});

onMounted(() => {
	ready.value = true;
	messageHandler = (e:SocketEvent) => onMessage(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, messageHandler);
});

onBeforeUnmount(() => {
	SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, messageHandler);
});

function onMessage(e:SocketEvent):void {
	if(typeof e.data != "object") return;

	switch(e.data.actionType) {
		case TwitchMessageType.PLAYLISTS:
			// console.log("SET PLAYLISTS");
			zoom.value = e.data.state.zoom;
			storeMain.twitchPlaylists = e.data.state.playlists;
			storeMain.twitchExpertMode = e.data.state.expert;
			storeMain.twitchGameState = null;
			storeMain.twitchLeaderboard = null;
			gameStarted = true;
			break;
		case TwitchMessageType.ROUND_STATE:
			// console.log("SET ROUND STATE");
			zoom.value = e.data.state.zoomLevel;
			storeMain.twitchPlaylists = null;
			storeMain.twitchExpertMode = null;
			storeMain.twitchGameState = e.data.state;
			storeMain.twitchLeaderboard = null;
			gameStarted = true;
			break;
		case TwitchMessageType.LEADERBOARD:
			// console.log("SET LEADERBOARD");
			storeMain.twitchPlaylists = null;
			storeMain.twitchExpertMode = null;
			storeMain.twitchGameState = null;
			storeMain.twitchLeaderboard = e.data.state;
			gameStarted = true;
			break;
		case TwitchMessageType.BROADCASTER_CONTROL:
			// console.log("BROADCASTER_CONTROL");
			break;
		case TwitchMessageType.SET_ZOOM_LEVEL:
			// console.log("SET_ZOOM_LEVEL");
			zoom.value = e.data.zoom
			break;
		case TwitchMessageType.CHANGE_VOLUME:
			storeMain.setVolume(e.data.volume);
			break;
		case TwitchMessageType.SET_TRACK_PLAY_STATE:
			//This is cpatured in the TwitchViewerGame clas
			break;
		default:
			console.error("Received a broadcast message with no handled \"actionType\" value");
			console.log(e.data);
	}

	// if(route.name == "twitchext/broadcaster") {
	// 	redirect();
	// }
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
		:deep(.icon) {
			top: 12px;
			width: 70px;
			height: 70px;
		}
	}
}
</style>