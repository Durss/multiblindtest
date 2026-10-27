<template>
	<div class="grouplobby">
		<SimpleLoader theme="mainColor_normal"
			v-if="loading"
			class="loader"
			big />

		<div v-if="!loading && !serverReboot" class="holder">
			<div class="playlists header">
				<h1>{{t('group.lobby.title')}}</h1>
				<div v-for="p in sortedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<Button :title="t('group.lobby.start')"
				class="start"
				type="button"
				:icon="getIcon('play')"
				big
				:disabled="room.users.length < 2 || (expertMode != null && expertMode.length == 0)"
				v-if="isHost"
				@click="startGame()" />

			<div class="users">
				<h2 class="highlight">{{t('group.lobby.players')}}</h2>
				<div class="content">
					<div class="list" v-if="room.users.length > 0">
						<GroupLobbyUser
							v-for="u in room.users"
							:key="u.id"
							:data="u"
							:me="me"
							:isHost="u.id == room.creator"
							@update="onUpdateUserHandicap"
							@updateName="onUpdateUserName"
						/>
					</div>

					<form @submit.prevent="onSubmit()" class="form" v-if="!me">
						<label for="username">{{t('group.lobby.join')}}</label>
						<div class="row">
							<input type="text" id="username" class="dark" v-model="userName" maxlength="30" :placeholder="t('group.lobby.usernamePlaceholder')" v-focus>
							<Button :icon="getIcon('checkmark_white')" class="submit" type="submit" :disabled="userName.length < 3" :loading="joining" />
						</div>
					</form>
				</div>
			</div>


			<GameParams v-if="isHost" class="params"
				v-model:gamesCount="gamesCount"
				v-model:gameDuration="gameDuration"
				v-model:tracksCount="tracksCount"
				v-model:acceptAlbum="acceptAlbum"
				v-model:expertMode="expertMode">
			</GameParams>

			<SimpleLoader theme="mainColor_normal"
				v-if="!isHost && room.users.length > 0"
				class="waitHost"
				:label="t('group.lobby.wait', {hostName:hostName})" />

			<ShareMultiplayerLink v-if="room" class="shareUrl" />
		</div>

		<div v-if="serverReboot" class="serverReboot">
			<div v-html="t('group.game.serverReboot')"></div>
			<Button :title="t('global.back')" class="back" white :to="{name:'home'}" />
		</div>
	</div>
</template>
<script setup lang="ts">
import GameParams from "@/components/GameParams.vue";
import { useStoreMain } from "@/store";
import { getIcon } from "@/utils/Icons";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Button from '../components/Button.vue';
import GroupLobbyUser from '../components/GroupLobbyUser.vue';
import ShareMultiplayerLink from '../components/ShareMultiplayerLink.vue';
import SimpleLoader from '../components/SimpleLoader.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import Api from '../utils/Api';
import RoomData from '../vo/RoomData';
import SocketEvent from '../vo/SocketEvent';
import UserData from '../vo/UserData';

const props = defineProps<{
	id?:string;
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const storeMain = useStoreMain();

const gamesCount = ref<number>(5);
const tracksCount = ref<number>(4);
const gameDuration = ref<number>(60);
const acceptAlbum = ref<boolean>(false);
const expertMode = ref<string[]>(null);
const showCopied = ref<boolean>(false);
const loading = ref<boolean>(true);
const joining = ref<boolean>(false);
const serverReboot = ref<boolean>(false);
const room = ref<RoomData>(null);
const userName = ref<string>("");

let joinHandler:any;
let leaveHandler:any;
let startGameHandler:any;
let handicapHandler:any;
let updateUserNameHandler:any;
let serverRebootHandler:any;

//Sort playlists by name size for a better looking list rendering
const sortedPlaylists = computed(():any[] => {
	return room.value.playlists.concat().sort((a, b) => {
		if(a.name > b.name) return 1;
		if(a.name < b.name) return -1;
		return 0;
	})
});

const isHost = computed(():boolean => {
	if(!me.value) return false;
	return room.value.creator == me.value.id;
});

const me = computed(():UserData => {
	return storeMain.userGroupData;
});

const hostName = computed(():string => {
	for (let i = 0; i < room.value.users.length; i++) {
		if(room.value.creator == room.value.users[i].id) {
			return room.value.users[i].name;
		}
	}
	return null;
});

onMounted(() => {
	joinHandler = (e) => onJoin(e);
	leaveHandler = (e) => onLeave(e);
	startGameHandler = (e) => onStartGame(e);
	handicapHandler = (e) => onHandicap(e);
	updateUserNameHandler = (e) => onUserName(e);
	serverRebootHandler = (e) => onServerReboot(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, joinHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, leaveHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.START_GROUP_GAME, startGameHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.UPDATE_HANDICAP, handicapHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.UPDATE_USERNAME, updateUserNameHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.SERVER_REBOOT, serverRebootHandler);
	loadDetails();
});

onBeforeUnmount(() => {
	//Cleanup listeners
	SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, joinHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, leaveHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.START_GROUP_GAME, startGameHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.UPDATE_HANDICAP, handicapHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.UPDATE_USERNAME, updateUserNameHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.SERVER_REBOOT, serverRebootHandler);
});

/**
 * Load group's details
 */
async function loadDetails():Promise<void> {
	try {
		let res = await Api.get("group/details", {roomId:props.id});
		room.value = res.room;
	}catch(error) {
		storeMain.alert = (error as {message:string}).message;
		if(storeMain.loggedin) {
			router.push({name:"playlists", params:{mode:"multi"}});
		}else{
			router.push({name:"home"});
		}
		return;
	}
	loading.value = false;
	if(me.value) {
		onSubmit();//Auto join room
	}
	if(room.value) {
		SockController.instance.groupId = room.value.id;
	}
}

/**
 * Called when subitting username form
 */
async function onSubmit():Promise<void> {
	joining.value = true;
	var res;
	let data:any = {
			username:userName.value,
			roomId:room.value.id
		};
	if(me.value) {
		delete data.username;
		data.user = me.value;
	}
	try {
		res = await Api.post("group/join", data);
		room.value = res.room;
	}catch(error) {
		joining.value = false;
		storeMain.alert = (error as {message:string}).message;
		return;
	}
	res.me.offline = false;
	storeMain.setUserGroupData(res.me);
	joining.value = false;
	if(room.value.currentTracks) {
		onStartGame();
	}
	if(room.value) {
		SockController.instance.groupId = room.value.id;
	}

	if(route.meta.restartMode) {
		SockController.instance.sendMessage({action:SOCK_ACTIONS.RESTART_GROUP_GAME, data:{roomId:room.value.id}})
	}
}

/**
 * Called when someone joins the room
 */
function onJoin(e:SocketEvent):void {
	if(!room.value) return;
	let found = false;
	for (let i = 0; i < room.value.users.length; i++) {
		if(room.value.users[i].id == e.data.user.id) {
			found = true;
			room.value.users[i].offline = false;
		}
	}
	if(!found) {
		room.value.users.push(e.data.user);
	}
}

/**
 * Called when someone leaves the room
 */
function onLeave(e:SocketEvent):void {
	if(!room.value) return;
	for (let i = 0; i < room.value.users.length; i++) {
		const u = room.value.users[i];
		if(u.id == e.data.user.id) {
			room.value.users[i].offline = true;
		}
	}
}

/**
 * Called when socket tells to start the game
 */
function onStartGame(e?:SocketEvent):void {
	let data = e? e.data : room.value;
	storeMain.groupRoomData = data;//This is only used to transmit data to game view
	router.push({name:"group/play"});
}

/**
 * Called when a user's handicap is updated
 */
function onHandicap(e:SocketEvent):void {
	for (let i = 0; i < room.value.users.length; i++) {
		const u = room.value.users[i];
		if(u.id == e.data.user.id) {
			u.handicap = e.data.handicap;
		}
	}
}

/**
 * Called when a user's name is updated
 */
function onUserName(e:SocketEvent):void {
	for (let i = 0; i < room.value.users.length; i++) {
		const u = room.value.users[i];
		if(u.id == e.data.user.id) {
			u.name = e.data.user.name;
		}
	}
}

/**
 * Called when clicking "start" button.
 * It sends a socket event to all users including self
 * See onStartGame() method
 */
function startGame():void {
	room.value.tracksCount = tracksCount.value;
	room.value.gamesCount = gamesCount.value;
	room.value.gameDuration = gameDuration.value;
	room.value.acceptAlbum = acceptAlbum.value;
	room.value.expertMode = expertMode.value;
	Api.post("group/update", {room:room.value, callerId:me.value.id});
	SockController.instance.sendMessage({action:SOCK_ACTIONS.START_GROUP_GAME, includeSelf:true, data:room.value});
}

/**
 * Handicap of a user updated
 */
function onUpdateUserHandicap(user:UserData, handicap:number):void {
	user.handicap = handicap;
	SockController.instance.sendMessage({action:SOCK_ACTIONS.UPDATE_HANDICAP, data:{user:user, handicap:handicap, groupId:room.value.id}});
}

/**
 * Called when a user updates her/his nickname
 */
function onUpdateUserName(user:UserData):void {
	storeMain.setUserName(user.name);
	SockController.instance.sendMessage({action:SOCK_ACTIONS.UPDATE_USERNAME, data:{user:user, groupId:room.value.id}});
}

/**
 * Called when server has reboot
 */
function onServerReboot(e:SocketEvent):void {
	serverReboot.value = true;
}

</script>

<style scoped lang="less">
.grouplobby{
	.loader {
		.center();
		position: absolute;
		transform: translate(-50%, -50%);
	}

	&>.holder {
		&>div {
			box-sizing: border-box;
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
	
		.start {
			display: flex;
			margin: auto;
			margin-top: 25px;
			margin-bottom: 25px;
		}
	
		.users {
			// width: 200px;
			width: min-content;
			margin: auto;
			min-width: 300px;
			.content {
				.blockContent();
				padding-bottom: 0px;

				.list {
					width: 100%;
					padding-bottom: 10px;
				}
				
				.form {
					display: flex;
					flex-direction: column;
					padding-bottom: 10px;
					.row {
						display: flex;
						flex-direction: row;
						input {
							flex-grow: 1;
							border-top-right-radius: 0;
							border-bottom-right-radius: 0;
						}
						.submit {
							width: 39px;
							border-top-left-radius: 0;
							border-bottom-left-radius: 0;
						}
					}
				}
			}
		}
	
		.waitHost {
			margin-top: 25px;
		}
	
		.shareUrl {
			margin:auto;
			margin-top: 25px;
		}
	}

	.backHome {
		margin: auto;
		margin-top: 25px;
		width: min-content;
		display: block;
	}

	.params {
		margin: auto;
		margin-top: 25px;
		display: flex;
		flex-direction: column;
		width: min-content;
		.content {
			.blockContent();
			.increment:not(:last-child) {
				margin-bottom: 20px;
			}
		}
	}
	
	.serverReboot {
		.center();
		position: absolute;
		color: #FFFFFF;
		background-color: @mainColor_warn;
		padding: 20px;
		border-radius: 20px;
		text-align: center;
		font-size: 24px;
		font-family: "Futura";

		.back {
			margin-top: 10px;
		}
	}
}
</style>