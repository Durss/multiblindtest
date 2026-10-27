<template>
	<div class="twitchextension">
		<div class="frameholder">
			<BouncingLoader class="loader" :icon="getIcon('home_logo')" v-if="!ready" />
			<router-view name="twitch" class="subView"></router-view>
		</div>
	</div>
</template>
<script setup lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import { useStoreMain } from "@/store";
import TwitchExtensionEvent from "@/twitch/TwitchExtensionEvent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import { getIcon } from "@/utils/Icons";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const storeMain = useStoreMain();

const isBroadcaster = ref<boolean>(false);
const ready = ref<boolean>(false);
let gameStarted:boolean = false;
let messageHandler:any;

const url = computed(():string => {
	return router.resolve({name:"twitch/auth"}).href.replace("#", "");
});

onMounted(async () => {
	storeMain.hideBackground = true;

	if(TwitchExtensionHelper.instance.connected) {
		onConnected();
	}else{
		await TwitchExtensionHelper.instance.onConnect();
		onConnected();
	}
	messageHandler = (e:TwitchExtensionEvent) => onMessage(e);
	TwitchExtensionHelper.instance.addEventListener(TwitchExtensionEvent.MESSAGE, messageHandler);
});

onBeforeUnmount(() => {
	TwitchExtensionHelper.instance.removeEventListener(TwitchExtensionEvent.MESSAGE, messageHandler);
});

function onConnected():void {
	ready.value = true;

	if(route.name != "twitchext") return;

	redirect();
}

function redirect():void {
	let isBroadcaster = TwitchExtensionHelper.instance.isBroadcaster;
	if(isBroadcaster && !gameStarted) {
		router.push({name:"twitchext/broadcaster"});
	}else{
		router.push({name:"twitchext/viewer", params:{isBroadcaster:isBroadcaster?"1":"0"}});
	}
}

function onMessage(e:TwitchExtensionEvent):void {
	if(typeof e.data != "object") return;

	switch(e.data.type) {
		case TwitchMessageType.PLAYLISTS:
			storeMain.twitchPlaylists = e.data.playlists;
			storeMain.twitchExpertMode = e.data.expert;
			storeMain.twitchGameState = null;
			storeMain.twitchLeaderboard = null;
			gameStarted = true;
			break;
		case TwitchMessageType.ROUND_STATE:
			storeMain.twitchPlaylists = null;
			storeMain.twitchExpertMode = null;
			storeMain.twitchGameState = e.data.state;
			storeMain.twitchLeaderboard = null;
			gameStarted = true;
			break;
		case TwitchMessageType.LEADERBOARD:
			storeMain.twitchPlaylists = null;
			storeMain.twitchExpertMode = null;
			storeMain.twitchGameState = null;
			storeMain.twitchLeaderboard = e.data.state;
			gameStarted = true;
			break;
		case TwitchMessageType.BROADCASTER_CONTROL:
			console.log("BROADCASTER_CONTROL");
			break;
		default:
			console.error("Received a broadcast message with no \"type\" value");
			console.log(e.data);
	}

	if(route.name == "twitchext/broadcaster") {
		redirect();
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
		:deep(.icon) {
			top: 12px;
			width: 70px;
			height: 70px;
		}
	}
}
</style>