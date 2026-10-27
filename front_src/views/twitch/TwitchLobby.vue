<template>
	<div class="twitchlobby">
		<BouncingLoader
			v-if="!ready"
			class="loader"
			:icon="getIcon('twitch')"
			:label="t('twitch.auth.connecting')" />
		
		<div v-if="ready">
			<div class="playlists header">
				<h1>{{t('group.lobby.title')}}</h1>
				<div v-for="p in selectedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<Button :title="t('group.lobby.start')"
				class="start"
				type="button"
				:icon="getIcon('play')"
				big
				@click="startGame()" />

			<!-- <div class="block players">
				<h2 class="highlight">{{t('group.lobby.players')}}</h2>
				<div class="content">
					<div class="command">
						<div>Type the following command on your chat to join the game:</div>
						<input type="text" v-model="command" class="dark small">
						<div class="info">(customize the command as you wish)</div>
						<Button class="sendToChat" title="Send instructions to chat" :icon="getIcon('twitch')" @click="sendToChat()" :loading="sendingToChat" />
					</div>

					<div class="playersCount">
						<img src="@/assets/icons/user.svg" class="icon">
						<span>{{players.length}}/{{maxPlayers}}</span>
					</div>

					<div class="users">
						<div v-for="u in players" :key="u.id" class="user" :style="getUserClasses(u)">
							<span class="text">{{u.username}}</span>
						</div>
					</div>
				</div>
			</div> -->

			<div class="block multipleWinners">
				<h2>{{t('twitch.lobby.multipleWins')}}</h2>
				<div class="content">
					<p>{{t('twitch.lobby.acceptDurationDetails')}}</p>
					<IncrementForm class="increment" :title="t('twitch.lobby.acceptDuration')" v-model="acceptDuration" :minValue="0" :maxValue="999" :step="1" />
				</div>
			</div>

			<div class="block params">
				<GameParams
				v-model:gamesCount="gamesCount"
				v-model:gameDuration="gameDuration"
				v-model:acceptAlbum="acceptAlbum"
				v-model:tracksCount="tracksCount"
				v-model:expertMode="expertMode">
					<IncrementForm class="increment" :title="t('twitch.lobby.zoomLevel')" v-model="zoomLevel" :minValue=".5" :maxValue="3" :step=".1" />
					<Button type="checkbox" v-model="chatConfirm" :title="t('twitch.lobby.chatConfirm')" :data-tooltip="t('twitch.lobby.chatConfirmTT')" />
					<!-- <IncrementForm class="increment" :title="t('twitch.lobby.maxPlayers')" v-model="maxPlayers" maxValue="200" :tenStep="true" /> -->
				</GameParams>
			</div>
			
			<div class="obsConfig">
				<h2>{{t('twitch.obs.title')}}</h2>
				<div class="content">
					<div>{{t('twitch.obs.configureUrl')}}</div>
					<div class="url" ref="url">
						<div class="text" @click="selectText">{{urlOBS}}</div>
						<Button :title="t('global.copy')" :icon="getIcon('copy')" highlight @click="copyURL()" />
					</div>
				</div>
			</div>
		</div>
		
	</div>
</template>
<script setup lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import GameParams from "@/components/GameParams.vue";
import IncrementForm from "@/components/IncrementForm.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import { useStoreMain } from "@/store";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import Api from "@/utils/Api";
import { getIcon } from "@/utils/Icons";
import Utils from "@/utils/Utils";
import PlaylistData from "@/vo/PlaylistData";
import SocketEvent from "@/vo/SocketEvent";
import gsap from "gsap/all";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const props = withDefaults(defineProps<{
	playlistids?:string;
	mode?:string;
}>(), {
	playlistids:"",
	mode:"",
});

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const url = useTemplateRef<HTMLDivElement>("url");

const urlOBS = ref<string>(null);
const selectedPlaylists = ref<PlaylistData[]>(null);

const ready = ref<boolean>(false);
let disposed:boolean = false;
const sendingToChat = ref<boolean>(false);
const maxPlayers = ref<number>(100);
const gamesCount = ref<number>(10);
const tracksCount = ref<number>(4);
const gameDuration = ref<number>(60);
const acceptDuration = ref<number>(3);
const acceptAlbum = ref<boolean>(false);
const chatConfirm = ref<boolean>(true);
const zoomLevel = ref<number>(1.4);
const expertMode = ref<string[]>([]);
const command = ref<string>("!mbt");
const players = ref<IRCTypes.Tag[]>([]);
let ircMessageHandler:any;
let socketMessageHandler:any;

const inviteMessage = computed(():string => {
	return "SingsNote Join the game with the following command \""+command.value+"\"";
});

function getUserClasses(u:IRCTypes.Tag):any {
	let res:any = {};
	if(u.color) res["background-color"] = u.color;
	//If background is dark enough, make the label bright so it stays readable
	let lum = Utils.getLuminance(u.color);
	if(lum < .72) res["color"] = "#ffffff";
	return res;
}

onMounted(async () => {
	ready.value = IRCClient.instance.connected;
	if(!ready.value) {
		try {
			let res = await IRCClient.instance.initialize(storeMain.twitchLogin, storeMain.twitchOAuthToken.access_token);
		}catch(error) {
			router.push({name:"twitch/auth"});
			return;
		}
		ready.value = true;
	}

	if(!props.playlistids) {
		router.push({name:"twitch/auth"});
		return;
	}

	let route = {name:'twitchobs/viewer', params:{twitchLogin:storeMain.twitchLogin}};
	urlOBS.value = document.location.origin+router.resolve(route).href;

	let playlists:PlaylistData[] = storeMain.playlistsCache;
	selectedPlaylists.value = [];

	for (let i = 0; i < playlists.length; i++) {
		if(props.playlistids.indexOf(playlists[i].id) > -1) {
			selectedPlaylists.value.push(playlists[i]);
		}
	}

	selectedPlaylists.value.sort((a, b) => {
		if(a.name > b.name) return 1;
		if(a.name < b.name) return -1;
		return 0;
	});

	broadcastInfosToExtension();

	ircMessageHandler = (e:IRCEvent) => onIrcMessage(e);
	IRCClient.instance.addEventListener(IRCEvent.MESSAGE, ircMessageHandler);

	let res = await Api.post("twitch/user", {token:IRCClient.instance.token});
	SockController.instance.connect();
	SockController.instance.keepBroadcastingLastMessage = true;
	SockController.instance.user = {
										name:"controler",
										id:res.user.user_id+"_ctrl",
										offline:false,
										score:0,
										handicap:0,
									};
	socketMessageHandler = (e:SocketEvent) => onSocketMessage(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, socketMessageHandler);
});

onBeforeUnmount(() => {
	disposed = true;
	IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, ircMessageHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, socketMessageHandler);
});

/**
 * Called when receiving a message from IRC
 */
function onIrcMessage(e:IRCEvent):void {
	if(e.tags["message-type"] == "action" && e.message == inviteMessage.value) {
		sendingToChat.value = false;
	}

	//User joins
	if(e.message.toLowerCase() == command.value.toLowerCase()) {
		if(players.value.length == maxPlayers.value) return;//Max players count reached

		for (let i = 0; i < players.value.length; i++) {
			const p = players.value[i];
			if(p["user-id"] == e.tags["user-id"]) return;//Uer already registered
		}
		players.value.push(e.tags);
	}
}

/**
 * Called when receiving a message via socket
 * This is used when the broadcaster uses the embeded controls
 * on his/her stream extension
 */
function onSocketMessage(e:SocketEvent):void {
	if(e.data == "!start") {
		startGame();
	}
}

/**
 * Sends a message to IRC
 */
function sendToChat():void {
	sendingToChat.value = true;
	setTimeout(() => {
		IRCClient.instance.sendMessage(inviteMessage.value);
	}, 250);
}

/**
 * Starts the game
 */
function startGame():void {
	// storeMain.setTwitchAllowedUsers(players.value);
	let params:any = {
		playlistids:props.playlistids,
		tracksCount:tracksCount.value.toString(),
		gamesCount:gamesCount.value.toString(),
		gameDuration:gameDuration.value.toString(),
		acceptAlbum:acceptAlbum.value? 1 : 0,
		chatConfirm:chatConfirm.value? 1 : 0,
		mode:props.mode,
		zoom:zoomLevel.value,
		acceptDuration:acceptDuration.value,
	}
	if(expertMode.value && expertMode.value.length > 0) {
		params.expertMode = expertMode.value.join(",");
	}

	router.push({name:"twitch/controls", params});
}

watch(expertMode, () => {
	broadcastInfosToExtension();
});

watch(zoomLevel, () => {
	broadcastInfosToExtension();
});

/**
 * Broadcast current config infos to clients
 */
function broadcastInfosToExtension():void {
	let playlists = [];
	for (let i = 0; i < selectedPlaylists.value.length; i++) {
		const p = selectedPlaylists.value[i];
		playlists.push({name:p.name, cover:p.cover, id:p.id})
	}
	let data = {
		playlists,
		expert:expertMode.value,
		zoom:zoomLevel.value,
	}
	if(props.mode == "twitchObs") {
		let event = {
			target:storeMain.twitchLogin+"_ext",
			data:{action:SOCK_ACTIONS.SEND_TO_UID, data:{actionType:TwitchMessageType.PLAYLISTS, state:data}}
		};
		SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data:event});
	}else{
		TwitchExtensionHelper.instance.broadcast(TwitchMessageType.PLAYLISTS, data);
	}
}

function copyURL():void {
	Utils.copyToClipboard(urlOBS.value);
	gsap.set(url.value, {filter:"brightness(100%)"})
	gsap.from(url.value, {duration:.5, filter:"brightness(200%)"})
}

function selectText(e:Event):void {
	let div = <HTMLDivElement>e.target;
	var selection = window.getSelection();
	var range = document.createRange();
	range.selectNodeContents(div);
	selection.removeAllRanges();
	selection.addRange(range);

}

</script>

<style scoped lang="less">
.twitchlobby{
	.loader {
		.center();
		position: absolute;
	}
	
	.playlists {
		display: flex;
		flex-direction: column;
		align-items: center;

		h1 {
			margin-bottom: 20px;
		}

		.playlist {
			background-color: @mainColor_normal;
			border-radius: 100px;
			display: flex;
			flex-direction: row;
			align-items: center;
			padding: 5px 10px 5px 5px;
			box-sizing: border-box;
			width: min-content;
			white-space: nowrap;
			max-width: 100%;
			margin-bottom: 5px;
			.label {
				color: #fff;
				margin-left: 5px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.cover {
				width: 30px;
				height: 30px;
				border-radius: 50%;
				object-fit: cover;
			}
		}
	}

	.multipleWinners {
		max-width: 300px;
		margin: auto;
		box-sizing: border-box;
	}

	.obsConfig {
		max-width: 300px;
		margin: auto;
		box-sizing: border-box;
		.content {
			.blockContent();
			.url {
				display: flex;
				flex-direction: row;
				justify-content: center;
				margin-top: 10px;
				margin-bottom: 10px;
				.text {
					color: #ffffff;
					padding: 5px 10px;
					display: inline-block;
					border-radius: 20px;
					background-color: @mainColor_normal;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					width: 200px;
					&:hover {
						word-wrap: break-word;
						overflow: visible;
						white-space: normal;
					}
				}
				.button {
					padding: 5px 10px 5px 5px;
					:deep(.icon) {
						margin-left: 0px;
						margin-right: 0px;
					}
				}
			}
		}
	}

	.params {
		margin: auto;
		width: min-content;
		.noBg {
			display: flex;
			flex-direction: row;
			align-items: center;
			margin-bottom: 5px;
			label {
				cursor: pointer;
				margin: 0;
				margin-left: 10px;
				white-space: nowrap;
			}
		}
	}

	.block {
		margin-bottom: 20px;
		.content {
			.blockContent();
		}
	}
	
	.start {
		display: flex;
		margin: auto;
		margin-top: 25px;
		margin-bottom: 25px;
	}

	.players {
		margin-left: auto;
		margin-right: auto;
		width: 350px;
		.command {
			margin-bottom: 10px;
			text-align: center;
			input {
				text-align: center;
			}
			.info {
				font-size: 14px;
			}
			.sendToChat {
				margin-top: 10px;
			}
		}

		.playersCount {
			text-align: center;
			font-style: italic;
			margin-bottom: 10px;
			.icon {
				height: 18px;
				margin-right: 5px;
				vertical-align: top;
			}
		}

		.users {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			.user {
				background-color: @mainColor_normal_light;
				border-radius: 15px;
				padding: 0 10px;
				color: @mainColor_dark;
				width: min-content;
				margin-bottom: 5px;
				margin-right: 5px;
				max-width: 50%;
				box-sizing: border-box;

				.text {
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 30px;
					width: 100%;
					box-sizing: border-box;
					display: inline-block;
					text-align: center;
				}
			}
		}
	}
}
</style>