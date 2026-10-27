<template>
	<div class="tracksplayer">
		<SimpleLoader theme="mainColor_normal"
			v-if="loading"
			class="loader"
			:label="t('game.loadingMP3')" />

		<div v-show="tracksToPlay && !loading">
			<div class="trackList">
				<div class="list">
					<TrackEntry
						v-for="track in tracksToPlay"
						:key="track.id"
						:data="track"
						:forceReveal="props.forceReveal"
						:canReplay="(props.forceReveal && multiplayerMode) || !multiplayerMode"
						:acceptAlbum="props.acceptAlbum"
						class="track"
						ref="track"
						@play="playTrack"
						@stop="stopTrack"
						small
					/>
				</div>

				<VolumeButton />

				<Button
					class="complete"
					:title="t('game.newGame')"
					:icon="getIcon('refresh')"
					v-if="complete && !tracksMode && !demoMode && !multiplayerMode"
					highlight
					big
					@click="startBlindTestFromPlaylists()"
				/>

				<Button
					class="complete"
					:title="t('game.newDemo')"
					:icon="getIcon('refresh')"
					v-if="complete && demoMode && !props.hideForm"
					highlight
					big
					@click="startBlindTestFromExamples()"
				/>

				<Button
					class="complete"
					:title="t('game.createGame')"
					:icon="getIcon('plus')"
					v-if="complete && tracksMode && !props.hideForm"
					highlight
					big
					@click="createBlindTest()"
				/>

				<slot></slot>

				<TrackAnswerForm class="answerForm"
					@guess="guessTrack"
					@sendToChat="sendToChat"
					@share="shareCurrentList()"
					@showAnswers="showAnswers()"
					@closeshare="shareUrl=''"
					ref="trackAnswerForm"
					:canGuess="props.canGuess"
					:showForm="!complete || multiplayerMode"
					:shareUrl="shareUrl"
					:showShare="!demoMode"
					:multiplayerMode="multiplayerMode"
					v-if="!props.hideForm"
				/>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { useStoreMain } from '@/store';
import SpotifyAPI from '@/utils/SpotifyAPI';
import TrackData from '@/vo/TrackData';
import Button from '@/components/Button.vue';
import AudioPlayer from '@/components/AudioPlayer';
import TrackEntry from '@/components/TrackEntry.vue';
import TrackAnswerForm from '@/components/TrackAnswerForm.vue';
import Utils from '@/utils/Utils';
import Config from '@/utils/Config';
import { getIcon } from '@/utils/Icons';
import AnswerTester from '../utils/AnswerTester';
import VolumeButton from '../components/VolumeButton.vue';
import ScoreHistory from '../vo/ScoreHistory';
import SimpleLoader from '../components/SimpleLoader.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import { v4 as uuidv4 } from 'uuid';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

//TODO test if it still works after removing scoreHistory. Make sure that track.score is populated properly

const props = withDefaults(defineProps<{
	tracksids?:string;
	playlistids?:string;
	trackscounts?:string;
	hideForm?:boolean;
	forceReveal?:boolean;
	acceptAlbum?:boolean;
	rawTracksData?:TrackData[];
	expertMode?:string[];
	scoreHistory?:ScoreHistory[];
	pause?:boolean;
	canGuess?:boolean;
}>(), {
	tracksids:"",
	playlistids:"",
	trackscounts:"",
	hideForm:false,
	forceReveal:false,
	acceptAlbum:false,
	rawTracksData:null,
	expertMode:null,
	scoreHistory:null,
	pause:false,
	canGuess:true,
});

const emit = defineEmits<{
	guessed:[track:TrackData];
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const storeMain = useStoreMain();

const trackEntries = useTemplateRef<InstanceType<typeof TrackEntry>[]>("track");
const trackAnswerForm = useTemplateRef<InstanceType<typeof TrackAnswerForm>>("trackAnswerForm");

const shareUrl = ref<string>("");
const loading = ref<boolean>(false);
const mute = ref<boolean>(true);
const complete = ref<boolean>(false);
const tracksMode = ref<boolean>(false);
const multiplayerMode = ref<boolean>(false);
const demoMode = ref<boolean>(false);
const tracks = ref<TrackData[]>([]);
const tracksToPlay = ref<TrackData[]>([]);

let audioPlayer:AudioPlayer;
let clickHandler:any;

const tracksCountAsNum = computed(():number => {
	let v = parseInt(props.trackscounts);
	if(isNaN(v)) v = Config.MAX_TRACK_COUNT;
	return Math.min(Config.MAX_TRACK_COUNT, Math.max(1, v));
});

onMounted(() => {
	demoMode.value = route.meta.demo === true;

	//if no data is found on URL or if no cache exists on storage, redirect to playlists loading
	if(!demoMode.value && (props.playlistids.length == 0 || !storeMain.playlistsCache) && props.tracksids.length == 0 && !props.rawTracksData) {
		if(storeMain.loggedin) {
			router.push({name:"playlists", params:{mode:"solo"}});
		}else{
			router.push({name:"home"});
		}
		return;
	}

	initAudioElements();
	if(props.rawTracksData && props.rawTracksData.length > 0) {
		startBlindTestFromTracksData();
	}else if(props.playlistids.length > 0) {
		startBlindTestFromPlaylists();
	}else if(demoMode.value){
		startBlindTestFromExamples();
	}else{
		startBlindTestFromTracks();
	}

	clickHandler = (e) => {
		if(storeMain.needUserInteraction) {
			startPlay();
		}
	};
	document.addEventListener("click", clickHandler);
});

/**
 * Dispose everything to free memory
 */
onBeforeUnmount(() => {
	if(audioPlayer) {
		audioPlayer.dispose();
	}
});

/**
 * Create reusable audio elements
 */
function initAudioElements():void {
	audioPlayer = new AudioPlayer(tracksCountAsNum.value);
	audioPlayer.onLoadError = (id)=> onLoadError(id);
	audioPlayer.onLoadComplete = _=> onLoadComplete();
	audioPlayer.onNeedUserInteraction = _=> {
		console.warn("Need user interaction...");
		checkComplete();
		if(!complete.value) {
			storeMain.needUserInteraction = true;
		}
	};
}

/**
 * Resets view state
 */
function resetState():void {
	tracksMode.value = false;
	multiplayerMode.value = false;
	loading.value = true;
	complete.value = false;
	storeMain.needUserInteraction = false;
}

/**
 * Starts a blind test from raw tracks data
 * This is useful for multiplayer mode. This way, the host can simply send
 * raw tracks infos as JSON and people will be able to load covers and MP3
 * without having to be authenticated
 */
async function startBlindTestFromTracksData():Promise<void> {
	resetState();
	tracksToPlay.value = props.rawTracksData;
	multiplayerMode.value = true;
	audioPlayer.populate(props.rawTracksData);
}

/**
 * Start a new blind test from playlists
 */
async function startBlindTestFromPlaylists():Promise<void> {
	resetState();
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		tracksToPlay.value[i].enabled = false;//Avoid having answer displayed if using a song already answered
	}

	let playlistIds = props.playlistids;
	let playlistsCache = storeMain.playlistsCache;
	let selectedPlaylists = [];
	for (let i = 0; i < playlistsCache.length; i++) {
		const p = playlistsCache[i];
		if(playlistIds.indexOf(p.id) > -1) {
			selectedPlaylists.push(p);
		}
	}

	tracks.value = [];
	for (let i = 0; i < selectedPlaylists.length; i++) {
		const p = selectedPlaylists[i];
		tracks.value = tracks.value.concat(p.tracks);
	}

	tracksToPlay.value = [];
	tracks.value = Utils.shuffle(tracks.value);
	for (let i = 0; i < tracksCountAsNum.value; i++) {
		let t = tracks.value[i];
		if(!t.audioPath) {
			i--;
			continue;
		}
		tracksToPlay.value.push(t);
	}
	audioPlayer.populate(tracksToPlay.value);
}

/**
 * Starts a blind test from specific tracks IDs
 */
async function startBlindTestFromTracks():Promise<void> {
	resetState();
	tracksMode.value = true;

	let tracksList:TrackData[] = [];
	//Get tracks infos from spotify
	let json = await SpotifyAPI.instance.call("v1/tracks", {ids:props.tracksids});
	//TODO manage case if some IDs are missing or if an ID is linked to a track
	//not available for the user (due to country restrictions)
	for (let i = 0; i < Math.min(tracksCountAsNum.value, json.tracks.length); i++) {
		const track = json.tracks[i];
		tracksList.push({
			id:track.id,
			enabled:false,
			name:track.name,
			artist:track.artists[0].name,
			album:track.album?.name,
			audioPath:track.preview_url,
		});
	}

	tracksToPlay.value = tracksList;
	audioPlayer.populate(tracksToPlay.value);
}

/**
 * Starts a blind test from local MP3 demos
 */
function startBlindTestFromExamples():void {
	resetState();
	tracks.value = Utils.getDemoTracks();
	tracksToPlay.value = Utils.shuffle(Utils.getDemoTracks()).splice(0, tracksCountAsNum.value);
	audioPlayer.populate(tracksToPlay.value);
}

/**
 * Called when an audio file loading completes
 * Check for all complete to start playing
 */
function onLoadComplete():void {
	loading.value = false;
	mute.value = false;

	//Stops the tracks that have been guessed.
	//This is usefull for multiplayer mode if a player
	//refreshes the page.
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const t = tracksToPlay.value[i];
		if(t.enabled || props.pause) {
			stopTrack(t);
		}
	}
}

/**
 * Called when a track's loading failed
 */
function onLoadError(trackId:string):void {
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const element = tracksToPlay.value[i];
		if(element.id == trackId) {
			element.loadFail = true;//Component will show the error
		}
	}
}

/**
 * Start playing songs
 */
function startPlay():void {
	storeMain.needUserInteraction = false;

	if(!props.pause && !mute.value) {
		audioPlayer.play();
	}

	//Stops the tracks that have been guessed.
	//This is usefull for multiplayer mode if a player
	//refreshes the page and is asked to click to start playing.
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const t = tracksToPlay.value[i];
		if(t.enabled || props.pause) {
			stopTrack(t);
		}
	}
}
watch(() => props.pause, () => startPlay());


/**
 * Called when user submits a guess via the form
 */
function guessTrack(value:string):any {
	let acceptTitle = !props.expertMode || props.expertMode.indexOf('title') > -1;
	let acceptArtist = !props.expertMode || props.expertMode.indexOf('artist') > -1;
	value = value.toLowerCase();
	let goodAnswer = false;

	// let res = AnswerTester.instance.testFuse(tracksToPlay.value, value);
	// if(res) {
	// 	res.enabled = true;
	// 	goodAnswer = true;
	// 	audioPlayer.stopTrack(res);
	// 	emit("guessed", res);
	// }
	// console.log(res.name, res.artist);

	//*
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		let t = tracksToPlay.value[i];
		if(!t.enabled
		&& (
			(acceptTitle && AnswerTester.instance.test(value, t.name, props.expertMode != null)) ||
			(props.acceptAlbum && AnswerTester.instance.test(value, t.album, props.expertMode != null)) ||
			(acceptArtist && AnswerTester.instance.test(value, t.artist, props.expertMode != null))
		)
		) {
			let score = tracksToPlay.value.length;
			for (let j = 0; j < tracksToPlay.value.length; j++) {
				if(tracksToPlay.value[j].enabled) score --;
			}
			t.enabled = true;
			t.score = score;
			goodAnswer = true;
			audioPlayer.stopTrack(t);
			emit("guessed", t);
			break;
		}
	}
	//*/

	if(!goodAnswer) {
		//Wrong answer, shake the field
		trackAnswerForm.value.shake();
	}else{
		//Good answer, shine and clear the field
		trackAnswerForm.value.shine();
		checkComplete();
	}
}


/**
 * Called when user sends a message to the chat
 */
function sendToChat(value:string):any {
	if(!multiplayerMode.value) return;
	SockController.instance.sendMessage({action:SOCK_ACTIONS.CHAT_MESSAGE, includeSelf:true, data:{id:uuidv4(), user:storeMain.userGroupData, message:value}});
}

/**
 * Display all answers when clicking "show answers" button (in solo mode)
 */
function showAnswers():void {
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const t = tracksToPlay.value[i];
		// audioObjects[i].pause();
		if(!t.enabled) {
			//Refs order isn't guaranteed to follow the list order, find the matching entry
			trackEntries.value.find(entry => entry.$props.data.id == t.id)?.allowManualStop();
		}
		t.enabled = true;
	}
	complete.value = true;
}

/**
 * Update URL with a shareable link to current playlist (in solo mode)
 */
function shareCurrentList():void {
	let ids = tracksToPlay.value.map(t=>t.id);
	// router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
	let path = router.resolve({name:"player/tracks", params:{tracksids:ids.join(",")}});
	Utils.copyToClipboard(window.location.protocol+"//"+window.location.host+path.href);
	shareUrl.value = window.location.protocol+"//"+window.location.host+path.href;
}

/**
 * Called when "create a Multi Blindtest" button is click
 */
function createBlindTest():void {
	router.push({name:"home"})
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
	audioPlayer.unpauseTrack(data);
}

/**
 * Toggle the play/pause state (in solo mode)
 */
function togglePlayPause():void {
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		if(!mute.value || props.pause) {
			audioPlayer.stopTrack(tracksToPlay.value[i]);
		}else
		if(!tracksToPlay.value[i].enabled) {
			audioPlayer.unpauseTrack(tracksToPlay.value[i]);
		}
	}
	mute.value = !mute.value;
}

/**
 * Used to catch changes made by the GroupGame view
 * when playing in multi player mode
 */
// watch(tracksToPlay, ..., {immediate: false, deep:false})
function checkComplete():void {
	let allGood = true;
	//Check if all the tracks have been found
	for (let i = 0; i < tracksToPlay.value.length; i++) {
		const t = tracksToPlay.value[i];
		if(!t.enabled && !t.loadFail) {
			allGood = false;
		}else{
			stopTrack(t);
		}
	}
	complete.value = allGood;
}

watch(() => props.rawTracksData, (a:TrackData[], b:TrackData[]) => {
	checkComplete();
	if(b) {
		//Check if it's a new track list or not
		//TODO : find a safer/cleaner way to achieve that
		let isNewList = false;
		for (let i = 0; i < b.length; i++) {
			if(a[i].id != b[i].id
			|| a[i].enabled != b[i].enabled
			|| a[i].audioPath != b[i].audioPath) {
				isNewList = true;
			}
		}
		if(isNewList) {
			//New tracks, restart everything
			startBlindTestFromTracksData();
		}
	}
}, {immediate: true, deep:true});

watch(() => storeMain.volume, () => {
	if(!audioPlayer) return;
	audioPlayer.volume = storeMain.volume;
}, {immediate: true});

</script>

<style scoped lang="less">
.tracksplayer{
	@size: 200px;
	
	.loader {
		margin: auto;
		margin-bottom: 50px;
	}

	.trackList {
		// .center();
		// position: absolute;
		display: flex;
		flex-direction: column;
		margin: auto;
		margin-bottom: 30px;
		max-width: ~"calc(100% - 40px)";

		.list {
			margin-bottom: 30px;
			.track:not(:last-child) {
				margin-bottom: 10px;
			}
		}

		.complete {
			align-self: center;
		}

	}
}
</style>