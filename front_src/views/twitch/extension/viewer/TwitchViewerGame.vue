<template>
	<div class="twitchviewergame" v-if="tracks.length > 0">
		<div class="step">
			<h1>{{t('twitch.game.index')}}</h1>
			<div class="count">{{currentRound}}/{{gamesCount}}</div>
		</div>

		<VolumeButton twitchMode v-if="!obsMode" />

		<TimerRenderer class="timer" ref="timer"
			:timerPercent="timerPercent"
			:duration="duration" />

		<div :class="tracksClasses">
			<div v-for="t in tracks" :key="t.id" class="track">
				<TrackEntry class="actualTrack"
					:data="t"
					:canReplay="!obsMode"
					:burstStars="true"
					:small="true"
					@play="playTrack(t)"
					@stop="stopTrack(t)"
				/>
			</div>
		</div>

		<CountDown v-if="!countDownComplete && !roundComplete" @complete="onCountDownComplete()" class="countdown" />
	</div>
</template>
<script setup lang="ts">
import AudioPlayer from "@/components/AudioPlayer";
import CountDown from "@/components/CountDown.vue";
import TimerRenderer from "@/components/TimerRenderer.vue";
import TrackEntry from "@/components/TrackEntry.vue";
import VolumeButton from "@/components/VolumeButton.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import { useStoreMain } from "@/store";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import SocketEvent from "@/vo/SocketEvent";
import TrackData from "@/vo/TrackData";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const storeMain = useStoreMain();

const gamesCount = ref<number>(0);
const currentRound = ref<number>(0);
const timerPercent = ref<number>(0);
const duration = ref<number>(0);
let timeOffset:number = 0;
const tracks = ref<TrackData[]>([]);
const scoreHistory = ref<ScoreHistory[]>([]);
const countDownComplete = ref<boolean>(false);
const roundComplete = ref<boolean>(false);
const gameComplete = ref<boolean>(false);
let disposed:boolean = false;
let currentTrackIds:string;
let audioPlayer:AudioPlayer;
let clickHandler:any;
let sockMessageHandler:any;

const obsMode = computed(():boolean => { return Utils.getRouteMetaValue(route, "obsMode"); });

const tracksClasses = computed(():string[] => {
	let res = ["tracks"];
	if(tracks.value.length == 5) res.push("center3rd");
	return res;
});

onMounted(() => {
	clickHandler = (e:MouseEvent) => {
		if(storeMain.needUserInteraction) {
			storeMain.needUserInteraction = false;
			if(countDownComplete.value && !roundComplete.value && !gameComplete.value) {
				startPlay();
			}
		}
	};

	if(obsMode.value) {
		storeMain.setVolume(1);
	}

	document.addEventListener("click", clickHandler);
	sockMessageHandler = (e:SocketEvent) => onSockMessage(e);
	SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, sockMessageHandler);
	renderFrame();
	onGameStateChange();
});

onBeforeUnmount(() => {
	disposed = true;
	if(audioPlayer) {
		audioPlayer.dispose();
	}
	document.removeEventListener("click", clickHandler);
	SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, sockMessageHandler);
});

/**
 * Start playing songs
 */
function startPlay():void {
	audioPlayer.play();
}

function onSockMessage(e:SocketEvent):void {
	if(typeof e.data != "object") return;

	switch(e.data.actionType) {
		case TwitchMessageType.SET_TRACK_PLAY_STATE:
			console.log(e.data.track, e.data.play);
			let track = tracks.value.find(t => t.id == e.data.track);
			console.log(track);
			if(track) {
				track.highlight = e.data.play === true;
				if(e.data.play) {
					audioPlayer.unpauseTrack(track);
				}else{
					audioPlayer.stopTrack(track)
				}
			}
			break;
	}
}

/**
 * Create reusable audio elements
 */
function initAudioElements():void {
	if(audioPlayer) {
		audioPlayer.stopAll();
		audioPlayer.dispose();
	}
	audioPlayer = new AudioPlayer(tracks.value.length);
	audioPlayer.onLoadError = (id)=> onLoadError(id);
	audioPlayer.onLoadComplete = _=> onLoadComplete();
	audioPlayer.onNeedUserInteraction = _=> {
		storeMain.needUserInteraction = true;
	};
}

/**
 * Called when an audio file loading completes
 * Check for all complete to start playing
 */
function onLoadComplete():void {
	if(!countDownComplete.value || roundComplete.value || gameComplete.value) {
		audioPlayer.pause();
	}
}

/**
 * Called when a track's loading failed
 */
function onLoadError(trackId:string):void {
	for (let i = 0; i < tracks.value.length; i++) {
		const element = tracks.value[i];
		if(element.id == trackId) {
			element.loadFail = true;//Component will show the error
		}
	}
}

/**
 * Called when countdown completes
 */
function onCountDownComplete():void {
	timerPercent.value = 0;
	countDownComplete.value = true;
	audioPlayer.play();
}

/**
 * Computes the timer
 */
function renderFrame():void {
	if(disposed) return;
	requestAnimationFrame(_=>renderFrame());
	if(!countDownComplete.value || roundComplete.value || timerPercent.value == 1) {
		timeOffset = new Date().getTime();
		return;
	}

	let ellapsed = new Date().getTime() - timeOffset;
	timerPercent.value = Math.min(1, ellapsed / (duration.value * 1000));

	if(timerPercent.value == 1) {
		audioPlayer.stopAll();
	}
}

/**
 * Called when manually stopping a track.
 * We can stop a track after revealing all the answers manually in solo mode
 */
function stopTrack(data:TrackData):void {
	audioPlayer.stopTrack(data);
}

/**
 * Called when manually playing a track.
 */
function playTrack(data:TrackData):void {
	if(storeMain.volume == 0) {
		storeMain.setVolume(.5);
		audioPlayer.stopAll();
	}
	audioPlayer.unpauseTrack(data);
}

watch(() => storeMain.twitchGameState, () => onGameStateChange());

function onGameStateChange():void {
	let state = storeMain.twitchGameState;
	tracks.value = state.tracks;
	gamesCount.value = state.games;
	currentRound.value = state.round;
	duration.value = state.duration;
	gameComplete.value = state.gameComplete;
	// timerPercent.value = state.ellapsedDuration / duration.value;
	if(!countDownComplete.value) {
		timeOffset = Date.now() - state.ellapsedDuration;
		if(state.ellapsedDuration > 0) {
			countDownComplete.value = true;
		}
	}

	// tracks.value = [];
	scoreHistory.value = [];
	if(state.roundComplete != roundComplete.value) {
		timerPercent.value = 1;
		if(audioPlayer) {
			audioPlayer.stopAll();
		}
	}
	roundComplete.value = state.roundComplete;

	for (let i = 0; i < tracks.value.length; i++) {
		const track:TrackData = tracks.value[i];
		if(track.enabled) {
			if(track.enabled && audioPlayer) {
				audioPlayer.stopTrack(track);
			}
		}
	}

	let trackIds = tracks.value.map(t => t.id).join(",");
	if(trackIds != currentTrackIds) {
		initAudioElements();
		currentTrackIds = trackIds;
		audioPlayer.populate(tracks.value);
		countDownComplete.value = false;
		timerPercent.value = 0;
	}
	// console.log(tracks.value);
	if(state.roundComplete || state.gameComplete) {
		timerPercent.value = 1;
		countDownComplete.value = true;
	}
}

watch(() => storeMain.volume, () => {
	if(!audioPlayer) return;
	audioPlayer.volume = storeMain.volume;
}, {immediate: true});

</script>

<style scoped lang="less">
.twitchviewergame{
	position: relative;
	.countdown {
		position: absolute;
		z-index: 4;
	}
	.step {
		position: absolute;
		width: 100%;
		height: 5.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family: Futura;
		z-index: 2;
		box-sizing: border-box;
		h1 {
			font-size: 1em;
		}
		.count {
			font-size: 1em;
			font-family: FuturaExtraBold;
			margin-top: 5px;
		}
	}

	.timer {
		width: 5.5em;
		height: 5.5em;
		margin: auto;
		z-index: 3;
	}

	.tracks {
		width: 100vw;
		max-width: calc(100vw - 10em);
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		.track {
			width: 45%;
			margin: .3em;
			border: .17em solid #ffffff;
			border-radius: 2.1em;
			background-color: #ffffff;
			box-sizing: border-box;

			.actualTrack {
				height: 100%;
			}
		}
		&.center3rd {
			.track:nth-child(3) {
				display: block;
				margin: 0 4em;
			}
		}
	}
}
</style>