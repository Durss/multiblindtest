<template>
	<div class="twitchviewercontrols">
		<transition name="slide">
			<Button ref="openBt" v-if="!opened" :icon="getIcon('gear')" class="openBt" @click.prevent.stop="opened = true" />
		</transition>
		<transition name="slide">
			<div v-if="opened" class="content" @click.stop>
				<Button white :loading="loading" :title="t('twitch.controls.start')" v-if="props.section=='playlists'" @click="startGame()" />
				<Button white :loading="loading" :title="t('twitch.controls.endRound')" v-if="props.section=='game' && !roundComplete" @click="endRound()" />
				<Button white :loading="loading" :title="t('twitch.controls.nextRound')" v-if="props.section=='game' && roundComplete && !gameComplete" @click="nextRound()" />
				<Button white :loading="loading" :title="t('twitch.controls.showResults')" v-if="props.section=='game' && gameComplete" @click="showResults()" />
				<Button white :loading="loading" :title="t('twitch.controls.replay')" v-if="props.section=='leaderboard'" @click="replay()" />
			</div>
		</transition>
	</div>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import { useStoreMain } from "@/store";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import { getIcon } from "@/utils/Icons";
import Utils from "@/utils/Utils";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const props = withDefaults(defineProps<{
	section?:string;
}>(), {
	section:"",
});

const { t } = useI18n();
const route = useRoute();
const storeMain = useStoreMain();

const loading = ref<boolean>(false);
const opened = ref<boolean>(false);
const roundComplete = ref<boolean>(false);
const gameComplete = ref<boolean>(false);
let clickHandler:any;

const socketName = computed(():string => {
	if(Utils.getRouteMetaValue(route, "obsMode")) {
		return storeMain.twitchLogin
	}else{
		return TwitchExtensionHelper.instance.auth.channelId;
	}
});

onMounted(async () => {
	clickHandler = (e:MouseEvent) => onClickOutside(e);
	document.body.addEventListener("click", clickHandler);
	// IRCClient.instance.sendMessage("test")

	if(!Utils.getRouteMetaValue(route, "obsMode")) {
		await TwitchExtensionHelper.instance.onConnect();
	}

	SockController.instance.connect();
	SockController.instance.user = {
										name:"stream",
										id:socketName.value+"_ext",
										offline:false,
										score:0,
										handicap:0,
									};
	onGameStateChange();
});

onBeforeUnmount(() => {
	SockController.instance.disconnect();
	document.body.removeEventListener("click", clickHandler);
});

function startGame():void {
	sendMessage("!start");
}

function endRound():void {
	sendMessage("!skip");
}

function nextRound():void {
	sendMessage("!next");
}

function showResults():void {
	sendMessage("!results");
}

function replay():void {
	sendMessage("!replay");
}

async function sendMessage(message:string):Promise<void> {
	let data = {
		target:socketName.value+"_ctrl",
		data:{action:SOCK_ACTIONS.SEND_TO_UID, data:message}
	};
	SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data});
	loading.value = true;
	setTimeout(_=> {
		loading.value = false;
	}, 1000)
	// let params = {
	// 	token:TwitchExtensionHelper.instance.auth.token,
	// 	channel:TwitchExtensionHelper.instance.auth.channelId,
	// 	clientId:TwitchExtensionHelper.instance.auth.clientId,
	// 	message
	// }
	// try {
	// 	await Api.post("twitch/sendToChat", params);
	// }catch(e){}
	// loading.value = false;
}

function onClickOutside(e:MouseEvent):void {
	opened.value = false;
}

watch(() => storeMain.twitchGameState, () => onGameStateChange(), { immediate: true, deep: true });

function onGameStateChange():void {
	let gameState = storeMain.twitchGameState;
	if(!gameState) return;
	roundComplete.value = gameState.roundComplete
	gameComplete.value = gameState.gameComplete

}

</script>

<style scoped lang="less">
.twitchviewercontrols{
	.openBt {
		position: absolute;
		width: 35px;
		height: 35px;
		padding: 5px;
		bottom: 0;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.content {
		background-color: @mainColor_normal;
		bottom: 0;
		position: absolute;
		padding: 10px;
		border-top-right-radius: 50px;
		border-bottom-right-radius: 50px;
	}

	.slide-enter-active, .slide-leave-active {
		transition: all .5s;
		transform: translate(0, 0);
	}
	.slide-enter-from, .slide-leave-to {
		transform: translate(-100%, 0);
	}
}
</style>