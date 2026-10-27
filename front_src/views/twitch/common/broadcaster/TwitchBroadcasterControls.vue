<template>
	<div class="twitchbroadcastercontrols">
		<h1>{{ t('twitch.game.index') }} {{ roundIndex }}/{{ gamesCount_num }}</h1>

		<div class="controls">
			<Button :title="t('twitch.controls.endRound')" v-if="!roundComplete" :disabled="!canSkip" @click="endRound()" />
			<Button :title="t('twitch.controls.nextRound')" v-if="roundComplete && !gameComplete" @click="nextRound()" />
			<Button :title="t('twitch.controls.showResults')" v-if="gameComplete" @click="onShowResults()" />
			<Button :title="t('twitch.controls.toggleMoreResults')" v-if="gameComplete && showResults && scoreHistory.length > 3"
				@click="onShowMoreResults()" />
			<Button :title="t('twitch.controls.replay')" v-if="gameComplete" @click="restartGame()" />
		</div>

		<div class="timer">{{ timeLeft }}</div>

		<div class="tracks" v-if="!showResults">
			<div v-for="t in currentTracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack" :data="t" :canReplay="true" :burstStars="true"
					:acceptAlbum="props.acceptAlbum == '1'" @play="changeTrackPlayState(t, true)"
					@stop="changeTrackPlayState(t, false)" />
			</div>
		</div>

		<VolumeButton horizontal class="volume" v-if="props.mode == 'twitchObs'" />
	</div>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import VolumeButton from "@/components/VolumeButton.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import { useStoreMain } from "@/store";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import AnswerTester from "@/utils/AnswerTester";
import Api from "@/utils/Api";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import SocketEvent from "@/vo/SocketEvent";
import TrackData from "@/vo/TrackData";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const props = withDefaults(defineProps<{
	playlistids?: string;
	tracksCount?: string;
	gamesCount?: string;
	gameDuration?: string;
	expertMode?: string;
	acceptAlbum?: string;
	chatConfirm?: string;
	mode?: string;
	zoom?: string;
	acceptDuration?: string;
}>(), {
	playlistids: "",
	tracksCount: "",
	gamesCount: "",
	gameDuration: "",
	expertMode: "",
	acceptAlbum: "",
	chatConfirm: "",
	mode: "",
	zoom: "",
	acceptDuration: "",
});

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const loading = ref<boolean>(true);
const ready = ref<boolean>(false);
let disposed: boolean = false;
const roundComplete = ref<boolean>(false);
const gameComplete = ref<boolean>(false);
const showResults = ref<boolean>(false);
const showMoreResults = ref<boolean>(false);
const canSkip = ref<boolean>(false);
const roundIndex = ref<number>(1);
const allTracks = ref<TrackData[]>([]);
const currentTracks = ref<TrackData[]>([]);
const scoreHistory = ref<ScoreHistory[]>([]);
const players = ref<IRCTypes.Tag[]>([]);
let startTime: number = 0;
let ellapsedTime: number = 0;
let frameDebounce: number = 0;
let volumeChangeDebounce: number = 0;
const timeLeft = ref<string>("");
let ircMessageHandler: any;
let socketMessageHandler: any;

let debugGameStarted: number = 0;
let debugEventsHistory: { date: number, data: any }[] = []

const tracksCount_num = computed((): number => { return parseInt(props.tracksCount); });
const gamesCount_num = computed((): number => { return parseInt(props.gamesCount); });
const gameDuration_num = computed((): number => { return parseInt(props.gameDuration); });

onMounted(async () => {
	loading.value = true;
	ready.value = IRCClient.instance.connected;
	if (!ready.value) {
		try {
			let res = await IRCClient.instance.initialize(storeMain.twitchLogin, storeMain.twitchOAuthToken.access_token);
		} catch (error) {
			router.push({ name: "twitch/auth" });
			return;
		}
		ready.value = true;
	}

	ircMessageHandler = (e: IRCEvent) => onIrcMessage(e);
	IRCClient.instance.addEventListener(IRCEvent.MESSAGE, ircMessageHandler);

	//Load test if chat is spammed
	// let u:any = []
	// u.username = "Durss";
	// u["user-id"] = "56413023";
	// setInterval(_=> {
	// 	for (let i = 0; i < 150; i++) {
	// 		guessTrack((Math.random()*9999999999999999999).toString(26), u);
	// 	}
	// },1000)
	pickRandomTracks();
	broadcastCurrentState();
	renderFrame();
	onVolumeChange();

	let res = await Api.post("twitch/user", { token: IRCClient.instance.token });
	SockController.instance.connect();
	SockController.instance.keepBroadcastingLastMessage = true;
	SockController.instance.user = {
		name: "controler",
		id: res.user.user_id + "_ctrl",
		offline: false,
		score: 0,
		handicap: 0,
	};
	socketMessageHandler = (e: SocketEvent) => onSocketMessage(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, socketMessageHandler);
});

onBeforeUnmount(() => {
	disposed = true;
	IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, ircMessageHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, socketMessageHandler);
});

/**
 * Called when receiving a message via socket
 * This is used when the broadcaster uses the embeded controls
 * on his/her stream extension
 */
function onSocketMessage(e: SocketEvent): void {
	parseBroadcasterCommands(e.data);
}

function renderFrame(): void {
	if (disposed) return;
	requestAnimationFrame(_ => renderFrame());
	if (roundComplete.value || startTime == 0) {
		timeLeft.value = "00:00";
		return;
	}

	let seconds = gameDuration_num.value * 1000 - (Date.now() - startTime);
	seconds = Math.min((gameDuration_num.value - 1) * 1000, seconds) + 1000;
	ellapsedTime = gameDuration_num.value * 1000 - seconds;
	let d = new Date(seconds);
	timeLeft.value = Utils.toDigits(d.getMinutes()) + ":" + Utils.toDigits(d.getSeconds());

	if (seconds <= 0) {
		endRound();
	}

	if (props.mode == "twitchObs") {
		frameDebounce++;
		if (frameDebounce > 60 * 5) {
			frameDebounce = 0;
			//This allows to update the currently ellapsed duration to extension
			broadcastCurrentState(false);
		}
	}
}

/**
 * Creates an array with all the tracks that can be played
 */
function generateAllTracksCollection(): void {
	allTracks.value = [];
	let selectedPlaylists = [];
	let playlists = storeMain.playlistsCache;
	for (let i = 0; i < playlists.length; i++) {
		const p = playlists[i];
		if (props.playlistids.indexOf(p.id) > -1) {
			selectedPlaylists.push(p);
		}
	}
	allTracks.value = [];
	for (let i = 0; i < selectedPlaylists.length; i++) {
		const p = selectedPlaylists[i];
		allTracks.value = allTracks.value.concat(p.tracks);
	}
	//Make a copy of the track to avoid modifying original data
	allTracks.value = JSON.parse(JSON.stringify(allTracks.value));
}

/**
 * Picks up random tracks amongst the ones that have not been used yet
 * Once all tracks have been used, recycle the old ones
 */
function pickRandomTracks(): void {
	loading.value = true;
	if (!allTracks.value || allTracks.value.length < tracksCount_num.value) {
		generateAllTracksCollection();
	}

	allTracks.value = Utils.shuffle(allTracks.value);
	let toPlay: TrackData[] = [];
	for (let i = 0; i < Math.min(6, Math.max(1, tracksCount_num.value)); i++) {
		let t = allTracks.value.shift();
		t.enabled = false;
		t.pendingAcceptation = false;
		t.guessedBy = null;
		t.score = null;
		toPlay.push(t);
	}
	currentTracks.value = toPlay;
	roundComplete.value = false;
	// console.log(currentTracks.value.map(v=>v.artist + " :: "+v.name).join("\n"));

	//Add 4 seconds, 1 second for websocket message to be sent
	//and 3 seconds for countdown
	startTime = Date.now() + 4000;

	//Avoids mistakenly double clicking the
	//button "Next round" then "End this round".
	//The "end this round" button will be enabled only
	//after a short delay.
	canSkip.value = false;
	setTimeout(_ => {
		canSkip.value = true;
	}, 500);

	debugEventsHistory = [];
	debugGameStarted = Date.now();
}

/**
 * Called when receiving a message from twitch
 */
function onIrcMessage(e: IRCEvent): void {
	if (e.tags.badges && e.tags.badges.broadcaster === "1") {
		if (parseBroadcasterCommands(e.message)) return;
	}

	if (roundComplete.value) return;

	guessTrack(e.message, e.tags);
}

/**
 * Parses for specific commands only allowed by the broadcaster.
 * This allow to skip a game, start the next one or show the results
 * without looking at the multiblindtest page.
 */
function parseBroadcasterCommands(message: string): boolean {
	switch (message.toLowerCase()) {

		case "!skip":
		case "!pass":
		case "!passer":
		case "⏹️":
			if (!roundComplete.value) {
				endRound();
				return true;
			}
			break;

		case "!next":
		case "!suite":
		case "!continue":
		case "⏭️":
			if (roundComplete.value && !gameComplete.value) {
				nextRound();
				return true;
			}
			break;

		case "!res":
		case "!result":
		case "!results":
		case "🏆":
			if (gameComplete.value) {
				onShowResults();
				return true;
			}
			break;

		case "!restart":
		case "!replay":
		case "!rejouer":
		case "!game":
		case "🔁":
			if (gameComplete.value) {
				restartGame();
				return true;
			}
			break;
	}
	return false;
}

/**
 * Called for every message sent on twitch chat.
 * Check if it matches the answer
 */
function guessTrack(value: string, user: IRCTypes.Tag): any {
	if (user["message-type"] != "chat") return;//Ignore messages that are not simple chats
	let acceptTitle = !props.expertMode || props.expertMode.indexOf('title') > -1;
	let acceptArtist = !props.expertMode || props.expertMode.indexOf('artist') > -1;
	let acceptAlbum = props.acceptAlbum == "1";
	value = value.toLowerCase();

	debugEventsHistory.push({ date: Date.now() - debugGameStarted, data: { value, user: { username: user.username, "user-id": user["user-id"] } } });

	//Add player to global players collection
	if (!players.value.find(u => u.username == user.username)) {
		players.value.push(user);
	}

	console.log("Guess track by", user.username);

	for (let i = 0; i < currentTracks.value.length; i++) {
		let t = currentTracks.value[i];
		if (!t.enabled
			&& (
				(acceptTitle && AnswerTester.instance.test(value, t.name, props.expertMode != null)) ||
				(acceptArtist && AnswerTester.instance.test(value, t.artist, props.expertMode != null)) ||
				(acceptAlbum && AnswerTester.instance.test(value, t.album, props.expertMode != null))
			)
		) {
			//If user already found this track, ignore it.
			//Avoids multiple scoring on twitch mode with "multiple winners" mode enabled
			if (t.guessedBy && t.guessedBy.findIndex(v => v.id == user["user-id"]) > -1) continue;

			let score;
			if (t.score) {
				//Track already has a score defined because it's pending acceptation
				score = t.score;
			} else {
				//define how much points the player earns by counting the
				//number of tracks left to be found
				score = currentTracks.value.length;
				for (let j = 0; j < currentTracks.value.length; j++) {
					if (currentTracks.value[j].enabled || currentTracks.value[j].pendingAcceptation) score--;
				}
				t.score = score;
			}

			//In "multiple winners" mode the next players to find a track get 1 point
			//less than the first player with a minimum of 1 point.
			if (t.guessedBy && t.guessedBy.length > 0 && t.pendingAcceptation) {
				score = Math.max(1, score - 1);
			}

			//Add to score history
			scoreHistory.value.push({
				trackId: t.id,
				guesserId: user["user-id"],
				score,
			});

			//Add user to guessers list
			if (!t.guessedBy) t.guessedBy = []
			t.guessedBy.push({
				name: user.username,
				id: user["user-id"],
				offline: false,
				score: 0,
				handicap: 0,
			});

			//"multiple winners" mode, wait desired seconds
			//before showing results
			if (props.acceptDuration) {
				if (!t.pendingAcceptation) {
					t.pendingAcceptation = true;
					//Give some time to other players to also find that track
					console.log("Schedule revealed in", props.acceptDuration + "s");
					setTimeout(_ => {
						//Show first guesser's name and number of other players
						let userName = t.guessedBy[0].name;
						if (t.guessedBy.length > 1) {
							userName += " (+" + (t.guessedBy.length - 1) + ")";
						}
						enableTrack(t, userName);
					}, parseFloat(props.acceptDuration) * 1000);
				}
			} else {
				enableTrack(t, user.username);
			}

			return;
		}
	}
}

/**
 * Enables a tracks once found
 */
function enableTrack(track: TrackData, userName: string): void {
	let chatConfirm = props.chatConfirm == "1";

	track.enabled = true;
	//reset multi winners mode vars
	track.pendingAcceptation = false;

	if (chatConfirm) {
		let message = t("twitch.game.confirmChat", {
			USER: userName,
			TITLE: track.name,
			ARTIST: track.artist,
		});
		IRCClient.instance.sendMessage(message);
	}
	checkComplete();
	broadcastCurrentState();
}

/**
 * Broadcast the current state to everyone
 *
 * @param verbose defines if a log should be displayed server side
 */
function broadcastCurrentState(verbose: boolean = true): void {
	let data: any = {};
	data.round = roundIndex.value;
	data.games = gamesCount_num.value;
	data.duration = gameDuration_num.value;
	data.ellapsedDuration = ellapsedTime;
	data.roundComplete = roundComplete.value;
	data.gameComplete = gameComplete.value;
	data.showMoreResults = showMoreResults.value;
	data.zoomLevel = parseFloat(props.zoom);

	if (!showResults.value) {
		data.tracks = currentTracks.value;
	} else {
		//Results data
		for (let i = 0; i < scoreHistory.value.length; i++) {
			const h = scoreHistory.value[i];
			if (h.guesserId) {
				let player = players.value.find(p => p["user-id"] == h.guesserId);
				if (player) {
					h.guesserName = player.username;
				}
			}
		}
		//Remove players with a 0 score and only keep the nicknames
		data.history = scoreHistory.value;
	}

	let actionType = showResults.value ? TwitchMessageType.LEADERBOARD : TwitchMessageType.ROUND_STATE;
	if (props.mode == "twitchObs") {
		let event = {
			target: storeMain.twitchLogin + "_ext",
			noVerbose: !verbose,
			data: { action: SOCK_ACTIONS.SEND_TO_UID, data: { actionType, state: data } }
		};
		SockController.instance.sendMessage({ action: SOCK_ACTIONS.SEND_TO_UID, data: event });
	} else {
		TwitchExtensionHelper.instance.broadcast(actionType, { state: data });
	}
}

/**
 * Used to catch changes made by the GroupGame view
 * when playing in multi player mode
 */
// watch(tracksToPlay, ..., {immediate: false, deep:false})
function checkComplete(): void {
	let allGood = true;
	//Check if all the tracks have been found
	for (let i = 0; i < currentTracks.value.length; i++) {
		const t = currentTracks.value[i];
		if (!t.enabled && !t.loadFail) {
			allGood = false;
		}
	}
	if (allGood) {
		endRound();
	}
}

/**
 * Called when clicking "next round" button
 */
function nextRound(): void {
	debugEventsHistory.push({ date: Date.now() - debugGameStarted, data: "next" });
	roundIndex.value++;
	ellapsedTime = 0;
	pickRandomTracks();
	broadcastCurrentState();
}

/**
 * Called when clicking "end round" button
 */
function endRound(): void {
	for (let i = 0; i < currentTracks.value.length; i++) {
		currentTracks.value[i].enabled = true;
	}
	roundComplete.value = true;
	gameComplete.value = roundIndex.value == gamesCount_num.value;
	if (!gameComplete.value) {
		debugEventsHistory.push({ date: Date.now() - debugGameStarted, data: "end" });
	}
	broadcastCurrentState();
}

/**
 * Called when clicking "show results" button
 */
function onShowResults(): void {
	showResults.value = true;
	broadcastCurrentState();
}

/**
 * Called when clicking "show +Top 4 results" button
 */
function onShowMoreResults(): void {
	showMoreResults.value = !showMoreResults.value;
	broadcastCurrentState();
}

/**
 * Called when clicking "Replay" button
 */
function restartGame(): void {
	gameComplete.value = false;
	roundComplete.value = false;
	showResults.value = false;
	showMoreResults.value = false;
	roundIndex.value = 1;
	scoreHistory.value = [];
	startTime = 0;
	ellapsedTime = 0;
	pickRandomTracks();
	broadcastCurrentState();
}

watch(() => storeMain.volume, () => onVolumeChange());

function onVolumeChange(): void {
	clearTimeout(volumeChangeDebounce);
	volumeChangeDebounce = setTimeout(_ => {
		let event = {
			target: storeMain.twitchLogin + "_ext",
			data: { action: SOCK_ACTIONS.SEND_TO_UID, data: { actionType: TwitchMessageType.CHANGE_VOLUME, volume: storeMain.volume } }
		};
		SockController.instance.sendMessage({ action: SOCK_ACTIONS.SEND_TO_UID, data: event });
	}, 100)
}

/**
 * Restarts a specific song
 */
function changeTrackPlayState(t: TrackData, play: boolean): void {
	let event = {
		target: storeMain.twitchLogin + "_ext",
		data: { action: SOCK_ACTIONS.SEND_TO_UID, data: { actionType: TwitchMessageType.SET_TRACK_PLAY_STATE, track: t.id, play } }
	};
	SockController.instance.sendMessage({ action: SOCK_ACTIONS.SEND_TO_UID, data: event });
}

</script>

<style scoped lang="less">
.twitchbroadcastercontrols {
	.controls {
		margin-top: 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;

		button {
			min-width: 200px;
			margin-bottom: 5px;
		}
	}

	.tracks {
		margin-top: 20px;

		.track {
			margin-bottom: 5px;
		}
	}

	.timer {
		display: block;
		margin: auto;
		width: min-content;
		margin-top: 20px;
		font-size: 30px;
		font-family: "Futura";
		font-weight: bold;
	}

	.volume {
		margin: auto;
		margin-top: 50px;
	}
}
</style>