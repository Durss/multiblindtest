<template>
	<div class="groupgame">
		<SimpleLoader v-if="loading" theme="mainColor_normal" />

		<div v-if="room && fullMe && !loading && tracksToPlay && !kicked && !serverReboot && !notEnoughPlayers">
			<CountDown v-if="pause && !roundComplete && !gameComplete && !fullMe.pass" @3SecComplete="on3SecComplete()" @complete="onCountDownComplete()" :seconds="4" :additionalTime="me.handicap" />

			<div class="countDown">
				<div class="label">{{t('group.game.index', {index:room.gameStepIndex, total:room.gamesCount})}}</div>
				<!-- <ExpertModeState v-if="room.expertMode && room.expertMode.length > 0" class="expertMode" :data="room.expertMode" /> -->
				<TimerRenderer :timerPercent="timerPercent" :duration="room.gameDuration" class="timer" />
			</div>

			<GameView
				v-if="tracksToPlay && tracksToPlay.length > 0"
				:rawTracksData="tracksToPlay"
				:trackscounts="tracksToPlay.length.toString()"
				:expertMode="room.expertMode"
				:scoreHistory="room.scoreHistory"
				:forceReveal="fullMe.pass || roundComplete"
				:pause="pause"
				:canGuess="!gaveUp"
				:acceptAlbum="room.acceptAlbum"
				@guessed="onTrackFound"
				ref="game"
				class="game"
			>
				<ChatWindow class="chat" />
			</GameView>

			<Button
				:title="t('group.game.giveup')"
				highlight
				:icon="getIcon('shrug')"
				class="giveUp"
				@click="onGiveUp()"
				:loading="loadingSkip"
				:disabled="pause"
				v-if="!fullMe.pass && !roundComplete && !gameComplete"
			/>

			<div v-if="roundComplete" class="complete">
				<div class="title" v-if="gameComplete">{{t('group.game.complete')}}</div>
				<div v-if="isHost" class="content">
					<Button class="button next" :title="t('group.game.next')" @click="pickRandomTracks()" v-if="!gameComplete" />
					<!-- <Button class="button" :title="t('group.game.new')" :to="{name:'playlists', params:{mode:'multi'}}" v-if="gameComplete" highlight /> -->
					<Button class="button" :title="t('group.game.new')" :to="{name:'groupRestart', params:{id:props.id}}" v-if="gameComplete" highlight />
					<Button class="button" :title="t('global.quit')" :to="{name:'home'}" v-if="gameComplete" highlight />
				</div>
				<div v-if="!isHost && !gameComplete" class="wait">
					<img src="@/assets/loader/loader.svg" alt="loading">
					<div v-html="t('group.game.wait', {hostName:hostName})"></div>
				</div>
				<div v-if="!isHost && gameComplete" class="content">
					<Button class="button" :title="t('global.quit')" :to="{name:'home'}" highlight />
				</div>
			</div>

			<div class="players">
				<h2>{{t('group.game.rank')}}</h2>
				<GroupUserList class="content" :room="room" :users="users" :me="me" :gameComplete="gameComplete" @kick="onKickUser" />
			</div>
		</div>

		<div v-if="kicked" class="kicked">
			<div>{{t('group.game.kicked')}}</div>
			<Button :title="t('global.back')" class="back" white :to="{name:'home'}" />
		</div>

		<div v-if="serverReboot" class="serverReboot">
			<div v-html="t('group.game.serverReboot')"></div>
			<Button :title="t('global.back')" class="back" white :to="{name:'home'}" />
		</div>

		<div v-if="notEnoughPlayers" class="serverReboot">
			<div v-html="t('group.game.notEnoughPlayers')"></div>
			<Button :title="t('global.back')" class="back" white :to="{name:'home'}" />
		</div>
	</div>
</template>
<script setup lang="ts">
import TimerRenderer from "@/components/TimerRenderer.vue";
import { useStoreMain } from "@/store";
import { getIcon } from "@/utils/Icons";
import PlaylistData from "@/vo/PlaylistData";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import Button from '../components/Button.vue';
import ChatWindow from '../components/ChatWindow.vue';
import CountDown from '../components/CountDown.vue';
import GroupUserList from '../components/GroupUserList.vue';
import SimpleLoader from '../components/SimpleLoader.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import Api from '../utils/Api';
import Utils from '../utils/Utils';
import RoomData from '../vo/RoomData';
import SocketEvent from '../vo/SocketEvent';
import TrackData from '../vo/TrackData';
import UserData from '../vo/UserData';
import GameView from './GameView.vue';

//TODO manage case when user reloads the page, the timer restarts from 0

const props = defineProps<{
	id?:string;
}>();

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const tracksIds = ref<string>(null);
const tracksToPlay = ref<TrackData[]>([]);
const room = ref<RoomData>(null);
const pause = ref<boolean>(true);
const kicked = ref<boolean>(false);
const gaveUp = ref<boolean>(false);
const loading = ref<boolean>(true);
const serverReboot = ref<boolean>(false);
const loadingSkip = ref<boolean>(false);
const roundComplete = ref<boolean>(false);
const notEnoughPlayers = ref<boolean>(false);
const me = ref<UserData>(null);
const allTracks = ref<TrackData[]>(null);
const timerPercent = ref<number>(0);
let disposed:boolean = false;
let timerStarted:boolean = false;
let timeOffset:number = 0;

let tracksDataHandler:any;
let playerSkipHandler:any;
let guessedTrackHandler:any;
let playerJoinLeftHandler:any;
let restartGameHandler:any;
let userKickedHandler:any;
let serverRebootHandler:any;

const isHost = computed(():boolean => { return me.value.id == room.value.creator; });

const users = computed(():UserData[] => {
	if(!room.value) return [];
	let list = room.value.users.concat();
	list.sort((a, b) => {
		if(a.score > b.score) return -1;
		if(a.score < b.score) return 1;
		return 0
	})
	return list;
});

const hostName = computed(():string => {
	for (let i = 0; i < room.value.users.length; i++) {
		if(room.value.creator == room.value.users[i].id) {
			return room.value.users[i].name;
		}
	}
	return null;
});

const gameComplete = computed(():boolean => {
	return roundComplete.value && room.value.gamesCount == room.value.gameStepIndex;
});

const fullMe = computed(():UserData => {
	let userRef = storeMain.userGroupData;
	for (let i = 0; i < room.value.users.length; i++) {
		const u = room.value.users[i];
		if(u.id == userRef.id) {
			return u;
		}
	}
});

onMounted(async () => {
	tracksDataHandler = (e) => onTracksData(e);
	guessedTrackHandler = (e) => onGuessedTrack(e);
	playerSkipHandler = (e) => onPlayerPass(e);
	playerJoinLeftHandler = (e) => onPlayerJoinLeft(e);
	restartGameHandler = (e) => onRestartGame(e);
	userKickedHandler = (e) => onUserKicked(e);
	serverRebootHandler = (e) => onServerReboot(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.TRACKS_DATA, tracksDataHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.GUESSED_TRACK, guessedTrackHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.PLAYER_PASS, playerSkipHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, playerJoinLeftHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, playerJoinLeftHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.RESTART_GROUP_GAME, restartGameHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.PLAYER_KICKED, userKickedHandler);
	SockController.instance.addEventListener(SOCK_ACTIONS.SERVER_REBOOT, serverRebootHandler);
	me.value = storeMain.userGroupData;

	if(!me.value) {
		//Redirect to group auth page
		router.push({name:"group", params:{id:props.id}});
		return;
	}
	await getRoomDetails();
	if(!room.value) return;

	if(room.value.currentTracks) {
		//If there are tracks it's because the game is already started
		//don't wait for socket event and just start it
		tracksToPlay.value = room.value.currentTracks;
		loading.value = false;
		checkComplete();
	}else if(room.value.creator == me.value.id) {
		pickRandomTracks();
	}
	renderFrame();
});

onBeforeUnmount(() => {
	disposed = true;
	SockController.instance.removeEventListener(SOCK_ACTIONS.TRACKS_DATA, tracksDataHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.GUESSED_TRACK, guessedTrackHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.PLAYER_PASS, playerSkipHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, playerJoinLeftHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, playerJoinLeftHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.RESTART_GROUP_GAME, restartGameHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.PLAYER_KICKED, userKickedHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.SERVER_REBOOT, serverRebootHandler);
});

function generateAllTracksCollection():boolean {
	loading.value = true;
	let playlistIds = room.value.playlists.map(p => p.id);
	let playlists = storeMain.playlistsCache;
	let selectedPlaylists:PlaylistData[] = [];
	for (let i = 0; i < playlists.length; i++) {
		const p = playlists[i];
		if(playlistIds.indexOf(p.id) > -1) {
			selectedPlaylists.push(p);
		}
	}

	if(selectedPlaylists.length == 0) {
		storeMain.alert = t("game.noPlaylists");
		return false;
	}

	allTracks.value = [];
	for (let i = 0; i < selectedPlaylists.length; i++) {
		const p = selectedPlaylists[i];
		allTracks.value = allTracks.value.concat(p.tracks);
	}
	//Make a copy of the track to avoid modifying original data
	allTracks.value = JSON.parse(JSON.stringify(allTracks.value));
	return true;
}

/**
 * Select tracks to be played
 */
function pickRandomTracks():void {
	if(!allTracks.value || allTracks.value.length < room.value.tracksCount) {
		if(!generateAllTracksCollection()) {
			//User probably deleted the playlist s·he's trying to load tracks from
			router.push({name:"home"});
			return;
		}
	}

	allTracks.value = Utils.shuffle(allTracks.value);
	let toPlay:TrackData[] = [];
	for (let i = 0; i < Math.min(6, Math.max(1, room.value.tracksCount)); i++) {
		let track = allTracks.value.shift();
		track.enabled = false;
		track.guessedBy = null;
		track.score = null;
		toPlay.push(track);
	}
	room.value.currentTracks = toPlay;

	Api.post("group/setTracks", {roomId:room.value.id, tracks:toPlay, callerId:me.value.id});
}

/**
 * Loads up room's details
 */
async function getRoomDetails():Promise<void> {
	room.value = storeMain.groupRoomData;
	//Room info not found on storage. User probably reloaded the page
	if(!room.value) {
		//Load it from server based on ID on URL
		try {
			let res = await Api.get("group/details", {roomId:props.id, user:me.value.id});
			room.value = res.room;
		}catch(error) {
			//room does not exists
			storeMain.alert = (error as {message:string}).message;

			if(storeMain.loggedin) {
				router.push({name:"playlists", params:{mode:"multi"}});
			}else{
				router.push({name:"home"});
			}
			return;
		}
		await joinRoom();
	}
	if(room.value) {
		SockController.instance.groupId = room.value.id;
		for (let i = 0; i < room.value.users.length; i++) {
			const u = room.value.users[i];
			if(u.id == me.value.id) me.value = u;
		}
	}
}

/**
 * Join a room
 */
async function joinRoom():Promise<void> {
	let data:any = {
			user: me.value,
			roomId:room.value.id
		};
	return await Api.post("group/join", data);
}

/**
 * Called when finding a track
 */
function onTrackFound(track:TrackData):void {
	Api.post("group/guessed", {roomId:room.value.id, user:me.value.id, trackId:track.id});
}

/**
 * Called when host sends tracks to be played
 */
function onTracksData(event:SocketEvent):void {
	loading.value = false;
	gaveUp.value = false;
	room.value = event.data;
	roundComplete.value = false;
	tracksToPlay.value = room.value.currentTracks;
	//Reset pass states
	for (let i = 0; i < room.value.users.length; i++) {
		room.value.users[i].pass = false;
	}
	pause.value = true;
	if(gameComplete.value) timerPercent.value = 1;
	else timerPercent.value = 0;
}

/**
 * Called when a player found a track
 */
function onGuessedTrack(event:SocketEvent):void {
	let newRoom:RoomData = event.data.room;
	let allGuessed = true;
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const track = tracksToPlay.value[i];
		let guessed = newRoom.currentTracks.find(t => t.id == track.id);
		if(guessed.guessedBy) {
			console.log(guessed);
			// track.guessedBy = guessed.guessedBy
			if(!track.guessedBy) {
				track.guessedBy = [guessed.guessedBy as unknown as UserData];
				track.enabled = true;
				track.score = guessed.score;
			}
		}else{
			allGuessed = false;
		}
	}
	roundComplete.value = allGuessed;
	if(gameComplete.value) timerPercent.value = 1;
	else timerPercent.value = 0;
	room.value.users = newRoom.users;
	room.value.scoreHistory = newRoom.scoreHistory;
}

/**
 * Called when a player joins/leaves the room
 */
function onPlayerJoinLeft(e:SocketEvent):void {
	let found = false;
	for (let i = 0; i < room.value.users.length; i++) {
		const u = room.value.users[i];
		if(u.id == e.data.user.id) {
			found = true;
			u.offline = e.getType() == SOCK_ACTIONS.LEAVE_ROOM;
		}
	}
	if(!found && e.getType() == SOCK_ACTIONS.JOIN_ROOM) {
		room.value.users.push(e.data.user);
	}
}

/**
 * Called when a player joins/leaves the room
 */
function onRestartGame(e:SocketEvent):void {
	router.push({name:"group", params:{id:e.data.roomId}})
}

/**
 * Called when a user has been kicked
 */
function onUserKicked(e:SocketEvent):void {
	if(e.data.userId == me.value.id) {
		kicked.value = true;
		//Stop all tracks
		for (let i = 0; i < tracksToPlay.value.length; i++) {
			const track = tracksToPlay.value[i];
			track.enabled = true;
		}
	}
	room.value = e.data.room;
	if(room.value.users.length < 2) {
		notEnoughPlayers.value = true;
	}
	storeMain.groupRoomData = e.data.room;
}

/**
 * Called when server has reboot
 */
function onServerReboot(e:SocketEvent):void {
	serverReboot.value = true;
	//Stop all tracks
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const track = tracksToPlay.value[i];
		track.enabled = true;
	}
}

/**
 * Called when player clicks "give up" button
 */
function onGiveUp():void {
	gaveUp.value = true;
	Utils.confirm(t('group.game.giveupConfirm.title'), null, t('group.game.giveupConfirm.description'))
	.then(async _=> {
		loadingSkip.value = true;
		try {
			await Api.post("group/pass", {userId:me.value.id, roomId:room.value.id});
		}catch(error) {
			storeMain.alert = (error as {message:string}).message;
		}
		loadingSkip.value = false;
		for (let i = 0; i < tracksToPlay.value.length; i++) {
			const track = tracksToPlay.value[i];
			track.enabled = true;
		}
	}).catch(_=>{/*don't care*/});
}

/**
 * Called when clicking kick button on a user
 */
async function onKickUser(user:UserData):Promise<void> {
	Api.post("group/kick", {roomId:room.value.id, userId:user.id, callerId:me.value.id});
}

/**
 * Check if game is complete
 */
function checkComplete():void {
	let complete = true;
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		if(!tracksToPlay.value[i].enabled) complete = false;
	}
	roundComplete.value = complete;
	if(gameComplete.value) timerPercent.value = 1;
	else timerPercent.value = 0;
}

/**
 * Called when a users skips
 */
function onPlayerPass(e:SocketEvent):void {
	let newRoom:RoomData = e.data.room;
	let majorityPassed:Boolean = e.data.pass;
	//Update pass state of all users
	for (let i = 0; i < room.value.users.length; i++) {
		const player = room.value.users[i];
		for (let j = 0; j < newRoom.users.length; j++) {
			if(newRoom.users[j].id == player.id) {
				player.pass = newRoom.users[j].pass;
			}
		}
	}
	if(majorityPassed) {
		endRound();
	}
}

/**
 * Forces end of current round
 */
function endRound():void {
	roundComplete.value = true;
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const track = tracksToPlay.value[i];
		track.enabled = true;
	}
}

/**
 * Computes the timer
 */
function renderFrame():void {
	if(disposed) return;
	requestAnimationFrame(_=>renderFrame());
	if(!timerStarted || roundComplete.value || timerPercent.value == 1) {
		timeOffset = new Date().getTime();
		return;
	}

	let ellapsed = new Date().getTime() - timeOffset;
	timerPercent.value = Math.min(1, ellapsed / (room.value.gameDuration * 1000));

	if(timerPercent.value == 1) {
		endRound();
	}
}

/**
 * Called when 3 seconds complete
 */
function on3SecComplete():void{
	timerPercent.value = 0;
	timerStarted = true;
}

/**
 * Called when start countdown completes
 */
function onCountDownComplete():void{
	timerStarted = true;
	pause.value = false;
	if(!me.value.handicap || me.value.handicap == 0) {
		timerPercent.value = 0;
	}
}

</script>

<style scoped lang="less">
.groupgame{
	.countDown {
		position: relative;
		margin: auto;
		display: block;
		width: 130px;
		height: 130px;
		z-index: 2;
		margin-top: 20px;
		margin-bottom: 40px;
		.expertMode {
			margin-top: 10px;
		}
		.timer {
			width: 100%;
			height: 100%;
		}
		.label {
			.center();
			position: absolute;
			text-align: center;
			font-family: "Futura";
			font-weight: bold;
			font-size: 30px;
		}
	}

	.giveUp {
		margin: auto;
		margin-bottom: 30px;
		display: block;
		
		:deep(.icon) {
			height: 100%;
			width: 40px;
		}
	}

	.game {
		// Allows the dimmer to be above the other elements of the page
		z-index: 1;
		position: relative;
	}

	.chat {
		margin-bottom: 30px;
	}

	.players {
		display: flex;
		flex-direction: column;
		width: min-content;
		margin: auto;
		border-radius: 20px;
		box-sizing: border-box;
		// color: @mainColor_dark;
		// background-color: @mainColor_normal_light;

		&>.content {
			.blockContent();
		}
	}

	.complete {
		margin: auto;
		margin-bottom: 50px;
		width: min-content;
		display: block;
		text-align: center;
		color: @mainColor_dark;
		padding: 15px;
		border-radius: 20px;
		background-color: @mainColor_normal_light;

		.title {
			font-family: "Futura";
			font-size: 25px;
			white-space: nowrap;
		}

		.wait {
			font-style: italic;
			margin-top: 10px;
			width:220px;
		}
		.content {
			.button:not(.next) {
				margin-top: 10px;
			}
		}
	}

	.kicked, .serverReboot {
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