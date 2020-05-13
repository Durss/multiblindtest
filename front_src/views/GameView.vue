<template>
	<div class="tracksplayer">
		<SimpleLoader theme="mainColor_normal"
			v-if="loading"
			class="loader"
			:label="$t('game.loadingMP3')" />

		<div v-show="tracksToPlay && !loading">
			<div class="trackList">
				<div class="list">
					<TrackEntry 
						v-for="track in tracksToPlay"
						:key="track.id"
						:data="track"
						:scoreHistory="scoreHistory"
						:forceReveal="forceReveal"
						class="track"
						ref="track"
						@stop="stopTrack"
					/>
				</div>

				<VolumeButton v-if="!complete" />

				<Button
					class="complete"
					:title="$t('game.newGame')"
					:icon="require('@/assets/icons/refresh.svg')"
					v-if="complete && !tracksMode && !demoMode && !multiplayerMode"
					highlight
					big
					@click="startBlindTestFromPlaylists()"
				/>

				<Button
					class="complete"
					:title="$t('game.newDemo')"
					:icon="require('@/assets/icons/refresh.svg')"
					v-if="complete && demoMode && !hideForm"
					highlight
					big
					@click="startBlindTestFromExamples()"
				/>

				<Button
					class="complete"
					:title="$t('game.createGame')"
					:icon="require('@/assets/icons/plus.svg')"
					v-if="complete && tracksMode && !hideForm"
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
					@closeShare="shareUrl=''"
					ref="trackAnswerForm"
					:canGuess="!complete || multiplayerMode"
					:shareUrl="shareUrl"
					:showShare="!demoMode"
					:multiplayerMode="multiplayerMode"
					v-if="!hideForm"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SpotifyAPI from '@/utils/SpotifyAPI';
import TrackData from '@/vo/TrackData';
import Button from '@/components/Button.vue';
import AudioPlayer from '@/components/AudioPlayer';
import TrackEntry from '@/components/TrackEntry.vue';
import TrackAnswerForm from '@/components/TrackAnswerForm.vue';
import Utils from '@/utils/Utils';
import Config from '@/utils/Config';
import StatsManager from '../utils/StatsManager';
import AnswerTester from '../utils/AnswerTester';
import VolumeButton from '../components/VolumeButton.vue';
import NeedInteractionLayer from '../components/NeedInteractionLayer.vue';
import ScoreHistory from '../vo/ScoreHistory';
import SimpleLoader from '../components/SimpleLoader.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import { v4 as uuidv4 } from 'uuid';

@Component({
	components:{
		Button,
		TrackEntry,
		SimpleLoader,
		VolumeButton,
		TrackAnswerForm,
		NeedInteractionLayer,
	}
})
export default class GameView extends Vue {

	@Prop({default:""})
	public tracksids:string;

	@Prop({default:""})
	public playlistids:string;

	@Prop({default:""})
	public trackscounts:string;

	@Prop({default:false})
	public hideForm:boolean;

	@Prop({default:false})
	public forceReveal:boolean;

	@Prop({default:null})
	public rawTracksData:TrackData[];

	@Prop({default:null})
	public expertMode:string[];

	@Prop({default:null})
	public scoreHistory:ScoreHistory[];

	@Prop({default:false})
	public pause:boolean;
	
	public shareUrl:string = "";
	public loading:boolean = false;
	public mute:boolean = true;
	public complete:boolean = false;
	public tracksMode:boolean = false;
	public multiplayerMode:boolean = false;
	public demoMode:boolean = false;
	public tracks:TrackData[] = [];
	public tracksToPlay:TrackData[] = [];

	private audioPlayer:AudioPlayer;
	private clickHandler:any;

	public get tracksCountAsNum():number {
		let v = parseInt(this.trackscounts);
		if(isNaN(v)) v = Config.MAX_TRACK_COUNT;
		return Math.min(Config.MAX_TRACK_COUNT, Math.max(2, v));
	}
	
	public mounted():void {
		this.demoMode = this.$route.meta.demo === true;

		//if no data is found on URL or if no cache exists on storage, redirect to playlists loading
		if(!this.demoMode && (this.playlistids.length == 0 || !this.$store.state.playlistsCache) && this.tracksids.length == 0 && !this.rawTracksData) {
			if(this.$store.state.loggedin) {
				this.$router.push({name:"playlists"});
			}else{
				this.$router.push({name:"home"});
			}
			return;
		}

		this.initAudioElements();
		if(this.rawTracksData && this.rawTracksData.length > 0) {
			this.startBlindTestFromTracksData();
		}else if(this.playlistids.length > 0) {
			this.startBlindTestFromPlaylists();
		}else if(this.demoMode){
			this.startBlindTestFromExamples();
		}else{
			this.startBlindTestFromTracks();
		}

		this.clickHandler = (e) => {
			if(this.$store.state.needUserInteraction) {
				this.startPlay();
			}
		};
		document.addEventListener("click", this.clickHandler);
	}

	/**
	 * Dispose everything to free memory
	 */
	public beforeDestroy():void {
		if(this.audioPlayer) {
			this.audioPlayer.dispose();
		}
	}

	/**
	 * Create reusable audio elements
	 */
	public initAudioElements():void {
		this.audioPlayer = new AudioPlayer(this.tracksCountAsNum);
		this.audioPlayer.onLoadError = (id)=> this.onLoadError(id);
		this.audioPlayer.onLoadComplete = _=> this.onLoadComplete();
		this.audioPlayer.onNeedUserInteraction = _=> {
			console.warn("Need user interaction...");
			this.checkComplete();
			if(!this.complete) {
				this.$store.dispatch("setNeedUserInteraction", true);
			}
		};
	}

	/**
	 * Resets view state
	 */
	private resetState():void {
		this.tracksMode = false;
		this.multiplayerMode = false;
		this.loading = true;
		this.complete = false;
		this.$store.dispatch("setNeedUserInteraction", false);
	}

	/**
	 * Starts a blind test from raw tracks data
	 * This is useful for multiplayer mode. This way, the host can simply send
	 * raw tracks infos as JSON and people will be able to load covers and MP3
	 * without having to be authenticated
	 */
	public async startBlindTestFromTracksData():Promise<void> {
		this.resetState();
		this.tracksToPlay = this.rawTracksData;
		this.multiplayerMode = true;
		this.audioPlayer.populate(this.rawTracksData);
	}

	/**
	 * Start a new blind test from playlists
	 */
	public async startBlindTestFromPlaylists():Promise<void> {
		this.resetState();
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			this.tracksToPlay[i].enabled = false;//Avoid having answer displayed if using a song already answered
		}

		let playlistIds = this.playlistids;
		let playlistsCache = this.$store.state.playlistsCache;
		let selectedPlaylists = [];
		for (let i = 0; i < playlistsCache.length; i++) {
			const p = playlistsCache[i];
			if(playlistIds.indexOf(p.id) > -1) {
				selectedPlaylists.push(p);
			}
		}
		
		this.tracks = [];
		for (let i = 0; i < selectedPlaylists.length; i++) {
			const p = selectedPlaylists[i];
			this.tracks = this.tracks.concat(p.tracks);
		}

		this.tracksToPlay = [];
		this.tracks = Utils.shuffle(this.tracks);
		for (let i = 0; i < this.tracksCountAsNum; i++) {
			let t = this.tracks[i];
			if(!t.audioPath) {
				i--;
				continue;
			}
			this.tracksToPlay.push(t);
		}
		this.audioPlayer.populate(this.tracksToPlay);
	}

	/**
	 * Starts a blind test from specific tracks IDs
	 */
	public async startBlindTestFromTracks():Promise<void> {
		this.resetState();
		this.tracksMode = true;

		let tracks:TrackData[] = [];
		//Get tracks infos from spotify
		let json = await SpotifyAPI.instance.call("v1/tracks", {ids:this.tracksids});
		//TODO manage case if some IDs are missing or if an ID is linked to a track
		//not available for the user (due to country restrictions)
		for (let i = 0; i < Math.min(this.tracksCountAsNum, json.tracks.length); i++) {
			const track = json.tracks[i];
			tracks.push({
				id:track.id,
				enabled:false,
				name:track.name,
				artist:track.artists[0].name,
				audioPath:track.preview_url,
			});
		}

		this.tracksToPlay = tracks;
		this.audioPlayer.populate(this.tracksToPlay);
	}

	/**
	 * Starts a blind test from local MP3 demos
	 */
	public startBlindTestFromExamples():void {
		this.resetState();
		this.tracks = Utils.getDemoTracks();
		this.tracksToPlay = Utils.shuffle(Utils.getDemoTracks()).splice(0, this.tracksCountAsNum);
		this.audioPlayer.populate(this.tracksToPlay);
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		this.loading = false;
		this.mute = false;
		
		//Stops the tracks that have been guessed.
		//This is usefull for multiplayer mode if a player
		//refreshes the page.
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const t = this.tracksToPlay[i];
			if(t.enabled || this.pause) {
				this.stopTrack(t);
			}
		}
	}

	/**
	 * Called when a track's loading failed
	 */
	public onLoadError(trackId:string):void {
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const element = this.tracksToPlay[i];
			if(element.id == trackId) {
				Vue.set(element, "loadFail", true);
			}
		}
	}

	/**
	 * Start playing songs
	 */
	@Watch("pause")
	public startPlay():void {
		this.$store.dispatch("setNeedUserInteraction", false);

		if(!this.pause && !this.mute) {
			this.audioPlayer.play();
		}
		
		//Stops the tracks that have been guessed.
		//This is usefull for multiplayer mode if a player
		//refreshes the page and is asked to click to start playing.
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const t = this.tracksToPlay[i];
			if(t.enabled || this.pause) {
				this.stopTrack(t);
			}
		}
	}
	

	/**
	 * Called when user submits a guess via the form
	 */
	public guessTrack(value:string):any {
		let acceptTitle = !this.expertMode || this.expertMode.indexOf('title') > -1;
		let acceptArtist = !this.expertMode || this.expertMode.indexOf('artist') > -1;
		value = value.toLowerCase();
		let goodAnswer = false;
		
		// let res = AnswerTester.instance.testFuse(this.tracksToPlay, value);
		// if(res) {
		// 	res.enabled = true;
		// 	goodAnswer = true;
		// 	this.audioPlayer.stopTrack(res);
		// 	this.$emit("guessed", res);
		// }
		// console.log(res.name, res.artist);

		//*
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			let t = this.tracksToPlay[i];
			if(!t.enabled
			&& (
				(acceptTitle && AnswerTester.instance.test(value, t.name, this.expertMode != null)) ||
				(acceptArtist && AnswerTester.instance.test(value, t.artist, this.expertMode != null))
			)
			) {
				t.enabled = true;
				goodAnswer = true;
				this.audioPlayer.stopTrack(t);
				this.$emit("guessed", t);
				break;
			}
		}
		//*/

		if(!goodAnswer) {
			//Wrong answer, shake the field
			(<TrackAnswerForm>this.$refs["trackAnswerForm"]).shake();
			StatsManager.instance.event("play","guess-fail", "Guess track fail");
		}else{
			//Good answer, shine and clear the field
			(<TrackAnswerForm>this.$refs["trackAnswerForm"]).shine();
			StatsManager.instance.event("play","guess-success", "Guess track success");
			this.checkComplete();
			if(this.complete) {
				StatsManager.instance.event("play","complete", "Game complete");
			}
		}
	}
	

	/**
	 * Called when user sends a message to the chat
	 */
	public sendToChat(value:string):any {
		SockController.instance.sendMessage({action:SOCK_ACTIONS.CHAT_MESSAGE, includeSelf:true, data:{id:uuidv4(), user:this.$store.state.userGroupData, message:value,}});
	}

	/**
	 * Display all answers when clicking "show answers" button
	 */
	public showAnswers():void {
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			// this.audioObjects[i].pause();
			if(!this.tracksToPlay[i].enabled) {
				(<TrackEntry>this.$refs.track[i]).allowManualStop();
			}
			this.tracksToPlay[i].enabled = true;
		}
		this.complete = true;
		StatsManager.instance.event("play","show", "Show answers");
	}

	/**
	 * Update URL with a shareable link to current playlist
	 */
	public shareCurrentList():void {
		let ids = this.tracksToPlay.map(t=>t.id);
		// this.$router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
		let path = this.$router.resolve({name:"player/tracks", params:{tracksids:ids.join(",")}});
		Utils.copyToClipboard(window.location.protocol+"//"+window.location.host+path.href);
		this.shareUrl = window.location.protocol+"//"+window.location.host+path.href;
		StatsManager.instance.event("play","share", "Share current mix");
	}

	/**
	 * Called when "create a Multi Blindtest" button is click
	 */
	public createBlindTest():void {
		this.$router.push({name:"home"})
	}

	/**
	 * Called when manually stopping a track.
	 * We can stop a track after revealing all the answers manually
	 */
	public stopTrack(data:TrackData):void {
		this.audioPlayer.stopTrack(data);
	}
	
	/**
	 * Toggle the play/pause state
	 */
	public togglePlayPause():void {
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			if(!this.mute || this.pause) {
				this.audioPlayer.stopTrack(this.tracksToPlay[i]);
			}else
			if(!this.tracksToPlay[i].enabled) {
				this.audioPlayer.unpauseTrack(this.tracksToPlay[i]);
			}
		}
		this.mute = !this.mute;
	}

	/**
	 * Used to catch changes made by the GroupGame view
	 * when playing in multi player mode
	 */
	// @Watch("tracksToPlay", {immediate: false, deep:false})
	public checkComplete():void {
		let allGood = true;
		//Check if all the tracks have been found
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			const t = this.tracksToPlay[i];
			if(!t.enabled && !t.loadFail) {
				allGood = false;
			}else{
				this.stopTrack(t);
			}
		}
		this.complete = allGood;
	}

	@Watch("rawTracksData", {immediate: true, deep:true})
	public onRawTracksDataChanged(a:TrackData[], b:TrackData[]):void {
		this.checkComplete();
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
				this.startBlindTestFromTracksData();
			}
		}
	}

	@Watch("$store.state.volume", {immediate: true, deep:true})
	public onVolumeChange(a, b):void {
		if(!this.audioPlayer) return;
		this.audioPlayer.volume = this.$store.state.volume;
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
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