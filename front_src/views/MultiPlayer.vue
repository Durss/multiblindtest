<template>
	<div class="multiplayer">
		<div v-if="tracksToPlay && !loading">
			<div class="trackList">
				<div class="list">
					<TrackEntry 
						v-for="track in tracksToPlay"
						:key="track.id"
						:data="track"
						class="track"
						ref="track"
						@stop="stopTrack"
					/>
				</div>

				<Button
					class="complete"
					title="New Multiblind Test"
					:icon="require('@/assets/icons/refresh.svg')"
					v-if="complete && !tracksMode"
					highlight
					big
					@click="startBlindTestFromPlaylists()"
				/>

				<Button
					class="complete"
					title="Create a Multiblind Test"
					:icon="require('@/assets/icons/plus.svg')"
					v-if="complete && tracksMode"
					highlight
					big
					@click="createBlindTest()"
				/>
				
				<TrackAnswerForm class="answerForm"
					@guess="guessTrack"
					@share="shareCurrentList()"
					@showAnswers="showAnswers()"
					ref="trackAnswerForm"
					:canGuess="!complete"
				/>
			</div>

			<div class="dimmer" v-if="needUserInteraction" @click="startPlay()"></div>

			<button v-if="needUserInteraction" @click="startPlay()" class="playBt">
				<img :src="require('@/assets/icons/play.svg')" alt="play" class="icon">
				<!-- <img :src="require('@/assets/loader/loader_border.svg')" alt="play" class="load"> -->
			</button>

		</div>

		<div v-if="loading" class="loader">
			<img src="@/assets/loader/loader.svg" alt="loader">
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

@Component({
	components:{
		Button,
		TrackEntry,
		TrackAnswerForm,
	}
})
export default class MultiPlayer extends Vue {

	@Prop({default:""})
	public tracksids:string;

	@Prop({default:""})
	public playlistids:string;
	
	public loading:boolean = false;
	public complete:boolean = false;
	public tracksMode:boolean = false;
	public tracks:TrackData[] = [];
	public tracksToPlay:TrackData[] = [];
	public needUserInteraction:boolean = false;

	private audioPlayer:AudioPlayer;
	
	public mounted():void {
		//if no data is found on URL or if no cache exists on storage, redirect to playlists loading
		if((this.playlistids.length == 0 || !this.$store.state.playlistsCache) && this.tracksids.length == 0) {
			this.$router.push({name:"playlists"});
			return;
		}

		this.initAudioElements();

		if(this.playlistids.length > 0) {
			this.startBlindTestFromPlaylists();
		}else{
			this.startBlindTestFromTracks();
		}
	}

	public beforeDestroy():void {
		this.audioPlayer.dispose();
	}

	/**
	 * Create reusable audio elements
	 */
	public initAudioElements():void {
		this.audioPlayer = new AudioPlayer(Config.TRACKS_COUNT);
		this.audioPlayer.onLoadComplete = _=> this.onLoadComplete();
		this.audioPlayer.onNeedUserInteraction = _=> {
			this.needUserInteraction = true;
		};
	}

	/**
	 * Start a new blind test from playlists
	 */
	public async startBlindTestFromPlaylists():Promise<void> {
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			this.tracksToPlay[i].enabled = false;//Avoid having answer displayed if using a song already answered
		}
		this.tracksMode = false;
		this.loading = true;
		this.complete = false;
		this.needUserInteraction = false;

		let playlistIds = this.playlistids;
		let playlists = this.$store.state.playlistsCache;
		let selectedPlaylists = [];
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
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
		for (let i = 0; i < Config.TRACKS_COUNT; i++) {
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
		this.tracksMode = true;
		this.loading = true;
		this.complete = false;
		this.needUserInteraction = false;

		let tracks:TrackData[] = [];
		//Get tracks infos from spotify
		let json = await SpotifyAPI.instance.call("v1/tracks", {ids:this.tracksids});
		//TODO manage case if some IDs are missing or if an ID is linked to a track
		//not available for the user (due to country restrictions)
		for (let i = 0; i < Math.min(Config.TRACKS_COUNT, json.tracks.length); i++) {
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
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		this.loading = false;
	}

	/**
	 * Start playing songs
	 */
	public startPlay():void {
		this.needUserInteraction = false;
		this.audioPlayer.play();
	}

	/**
	 * Called when user submits a guess via the form
	 */
	public guessTrack(value:string):any {
		value = value.toLowerCase();
		let goodAnswer = false;
		for (let i = 0; i < this.tracksToPlay.length; i++) {
			let t = this.tracksToPlay[i];
			if(!t.enabled
			&& (
				//Check for answer in title and artist with elastic error tolerence
				Utils.levenshtein(t.name, value) < t.name.length * .25
				|| Utils.levenshtein(t.artist, value) < t.artist.length * .25
				//check for exact occurence in title and artist to be able to write a shortened
				//version of an artist's name for example.
				|| ((value.length >= 5 || value.length >= t.name.length * .25) && t.name.toLowerCase().indexOf(value) > -1)
				|| ((value.length >= 5 || value.length >= t.artist.length * .25) && t.artist.toLowerCase().indexOf(value) > -1)
			)
			) {
				t.enabled = true;
				goodAnswer = true;
				this.audioPlayer.stopTrack(t);
				break;
			}
		}
		if(!goodAnswer) {
			//Wrong answer, shake the field
			(<TrackAnswerForm>this.$refs["trackAnswerForm"]).shake();
		}else{
			//Good answer, shine and clear the field
			(<TrackAnswerForm>this.$refs["trackAnswerForm"]).shine();
			let allGood = true;
			//Check if all the tracks have been found
			for (let i = 0; i < this.tracksToPlay.length; i++) {
				const t = this.tracksToPlay[i];
				if(!t.enabled) {
					allGood = false;
					break;
				}
			}
			this.complete = allGood;
		}
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
	}

	/**
	 * Update URL with a shareable link to current playlist
	 */
	public shareCurrentList():void {
		let ids = this.tracksToPlay.map(t=>t.id);
		this.$router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
		let path = this.$router.resolve({name:"player/tracks", params:{tracksids:ids.join(",")}});
		Utils.copyToClipboard(window.location.protocol+"//"+window.location.host+path.href);
	}

	/**
	 * Called when "create a Multiblind test" button is click
	 */
	public createBlindTest():void {
		this.$router.push({name:"playlists"})
	}

	/**
	 * Called when manually stopping a track.
	 * We can stop a track after revealing all the answers manually
	 */
	public stopTrack(data:TrackData):void {
		this.audioPlayer.stopTrack(data);
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.multiplayer{
	@size: 300px;

	.loader {
		position: fixed;
		top: 50%;
		left: 50%;
		width: @size / 2;
		height: @size / 2;
		transform: translate(-50%, -50%);
		img {
			width: 100%;
			height: 100%;
		}
	}

	.trackList {
		// .center();
		// position: absolute;
		display: flex;
		flex-direction: column;
		width: 90%;
		margin: auto;
		max-width: 500px;
		margin-bottom: 20px;

		.list {
			margin-bottom: 30px;
			.track {
				margin-bottom: 10px;
			}
		}

		.answerForm {
			margin-top: 20px;
		}

		.complete {
			align-self: center;
		}
	}

	.dimmer {
		background-color: rgba(255, 255, 255, .75);
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
	}

	.playBt {
		width: @size;
		height: @size;
		padding: @size * .15;
		padding-left: @size * .3;
		border-radius: 50%;
		position: fixed;
		.center();

		.icon {
			width: 100%;
			height: 100%;
		}
		.load {
			position: absolute;
			width: 100%;
			height: 100%;
			left: 0;
			top: 0;
		}
	}
}
</style>