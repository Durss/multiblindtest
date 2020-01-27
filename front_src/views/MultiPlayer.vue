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
					class="playpause"
					:icon="require('@/assets/icons/'+(isPlaying? 'pause' : 'play')+'.svg')"
					v-if="!complete"
					big
					@click="togglePlayPause()"
				/>

				<Button
					class="complete"
					title="New Multi Blindtest"
					:icon="require('@/assets/icons/refresh.svg')"
					v-if="complete && !tracksMode && !exampleMode"
					highlight
					big
					@click="startBlindTestFromPlaylists()"
				/>

				<Button
					class="complete"
					title="New example"
					:icon="require('@/assets/icons/refresh.svg')"
					v-if="complete && exampleMode"
					highlight
					big
					@click="startBlindTestFromExamples()"
				/>

				<Button
					class="complete"
					title="Create a Multi Blindtest"
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
					@closeShare="shareUrl=''"
					ref="trackAnswerForm"
					:canGuess="!complete"
					:shareUrl="shareUrl"
					:showShare="!exampleMode"
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
	
	public shareUrl:string = "";
	public loading:boolean = false;
	public isPlaying:boolean = false;
	public complete:boolean = false;
	public tracksMode:boolean = false;
	public exampleMode:boolean = false;
	public tracks:TrackData[] = [];
	public tracksToPlay:TrackData[] = [];
	public needUserInteraction:boolean = false;

	private audioPlayer:AudioPlayer;
	
	public mounted():void {
		this.exampleMode = this.$route.name == "example";

		//if no data is found on URL or if no cache exists on storage, redirect to playlists loading
		if(!this.exampleMode && (this.playlistids.length == 0 || !this.$store.state.playlistsCache) && this.tracksids.length == 0) {
			this.$router.push({name:"playlists"});
			return;
		}

		this.initAudioElements();
		if(this.playlistids.length > 0) {
			this.startBlindTestFromPlaylists();
		}else if(this.exampleMode){
			this.startBlindTestFromExamples();
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
		this.audioPlayer = new AudioPlayer(Config.MAX_TRACK_COUNT);
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
		for (let i = 0; i < Config.MAX_TRACK_COUNT; i++) {
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
		for (let i = 0; i < Math.min(Config.MAX_TRACK_COUNT, json.tracks.length); i++) {
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
	 * Starts a blind test from local MP3 examples
	 */
	public startBlindTestFromExamples():void {
		let allTracks = [];
		allTracks.push({
			id:"fab3ba2d8224f7006e8c92b7fe1171d50265d37d",
			enabled:false,
			name:"Save Tonight",
			artist:"Eagle-Eye Cherry",
			audioPath:"/mp3/fab3ba2d8224f7006e8c92b7fe1171d50265d37d.mp3",
		});
		allTracks.push({
			id:"aa4f9186e0c3f4436bb40572a63862db80d7ef2d",
			enabled:false,
			name:"Highway to Hell",
			artist:"AC/DC",
			audioPath:"/mp3/aa4f9186e0c3f4436bb40572a63862db80d7ef2d.mp3",
		});
		allTracks.push({
			id:"b56a70770267b00ccae13c2e8c8a34ed54627d02",
			enabled:false,
			name:"Like a Prayer",
			artist:"Madona",
			audioPath:"/mp3/b56a70770267b00ccae13c2e8c8a34ed54627d02.mp3",
		});
		allTracks.push({
			id:"ac8375f8237f6bfd9c03cd074ac674d82f24cc8a",
			enabled:false,
			name:"Romeo and Juliet",
			artist:"Dire Straits",
			audioPath:"/mp3/ac8375f8237f6bfd9c03cd074ac674d82f24cc8a.mp3",
		});
		allTracks.push({
			id:"50e82c99c20ffa4223e82250605bbd8500cb3928",
			enabled:false,
			name:"Hotel California",
			artist:"Eagles",
			audioPath:"/mp3/50e82c99c20ffa4223e82250605bbd8500cb3928.mp3",
		});
		allTracks.push({
			id:"e7eb60e9466bc3a27299ea8803aadf4fa9cf795c",
			enabled:false,
			name:"Creep",
			artist:"Radiohead",
			audioPath:"/mp3/e7eb60e9466bc3a27299ea8803aadf4fa9cf795c.mp3",
		});
		allTracks.push({
			id:"5fcdcfe7ef20abd006bba666b4a7dff01dd5ec21",
			enabled:false,
			name:"My heart will go on (Titanic)",
			artist:"Céline Dion",
			audioPath:"/mp3/5fcdcfe7ef20abd006bba666b4a7dff01dd5ec21.mp3",
		});
		allTracks.push({
			id:"645cd4b425f1d48d37656cac99d640254a8f64a9",
			enabled:false,
			name:"Lemon Tree",
			artist:"Fool's Garden",
			audioPath:"/mp3/645cd4b425f1d48d37656cac99d640254a8f64a9.mp3",
		});
		allTracks.push({
			id:"22b0ba88409ea7a8d7de70a3f0fa8a3f9a20bdfb",
			enabled:false,
			name:"Can you feel the love tonight",
			artist:"Elton John",
			audioPath:"/mp3/22b0ba88409ea7a8d7de70a3f0fa8a3f9a20bdfb.mp3",
		});
		allTracks.push({
			id:"a66864fcfd8923c6084fc2000e3086e4e1e0a657",
			enabled:false,
			name:"Basket Case",
			artist:"Green Day",
			audioPath:"/mp3/a66864fcfd8923c6084fc2000e3086e4e1e0a657.mp3",
		});
		allTracks.push({
			id:"2da7ea19b35ecbfaf2dd7273e9b305a4e090bbc9",
			enabled:false,
			name:"Everybody",
			artist:"Backstreet Boys",
			audioPath:"/mp3/2da7ea19b35ecbfaf2dd7273e9b305a4e090bbc9.mp3",
		});
		allTracks.push({
			id:"2a5b5a9977f58ae525b473455e9f2e67a9edf8d7",
			enabled:false,
			name:"Freestyler",
			artist:"Bomfunk MC's",
			audioPath:"/mp3/2a5b5a9977f58ae525b473455e9f2e67a9edf8d7.mp3",
		});
		allTracks.push({
			id:"0d99160a29e74e74335f3bf7909260c0f2a5ca98",
			enabled:false,
			name:"Scatman (ski-ba-bop-ba-dop-bop)",
			artist:"Scatman John",
			audioPath:"/mp3/0d99160a29e74e74335f3bf7909260c0f2a5ca98.mp3",
		});
		allTracks.push({
			id:"e4ef557302eaf59468e8848415c225f24939361f",
			enabled:false,
			name:"Bohemian Rhapsody",
			artist:"Queen",
			audioPath:"/mp3/e4ef557302eaf59468e8848415c225f24939361f.mp3",
		});
		allTracks.push({
			id:"8ec3a4b322c0df167ad409a668ceaa704fcbd1c0",
			enabled:false,
			name:"Life on Mars",
			artist:"David Bowie",
			audioPath:"/mp3/8ec3a4b322c0df167ad409a668ceaa704fcbd1c0.mp3",
		});
		allTracks.push({
			id:"dd78dafe31bb98f230372c038a126b8808f9349b",
			enabled:false,
			name:"Africa",
			artist:"Toto",
			audioPath:"/mp3/dd78dafe31bb98f230372c038a126b8808f9349b.mp3",
		});
		allTracks.push({
			id:"84462d8e1e4d0f9e5ccd06f0da390f65843774a2",
			enabled:false,
			name:"Shape of you",
			artist:"Ed Sheeran",
			audioPath:"/mp3/84462d8e1e4d0f9e5ccd06f0da390f65843774a2.mp3",
		});
		allTracks.push({
			id:"cda5ee4b7028e5aaca877263844f0de5354dcdfe",
			enabled:false,
			name:"Barbie Girl",
			artist:"Aqua",
			audioPath:"/mp3/cda5ee4b7028e5aaca877263844f0de5354dcdfe.mp3",
		});
		allTracks.push({
			id:"da2134a161f1cb34d17c2d6d7e77cc93d1c1e6f7",
			enabled:false,
			name:"...Baby One More Time",
			artist:"Britney Spears",
			audioPath:"/mp3/da2134a161f1cb34d17c2d6d7e77cc93d1c1e6f7.mp3",
		});
		allTracks.push({
			id:"98959d757d14bc4924e92e91e3d3035ce48059fc",
			enabled:false,
			name:"Wannabe",
			artist:"Spice girls",
			audioPath:"/mp3/98959d757d14bc4924e92e91e3d3035ce48059fc.mp3",
		});
		allTracks.push({
			id:"c0984bf089f7e7534d6c838fd4204cc40ed87368",
			enabled:false,
			name:"Sk8er Boi",
			artist:"Avril Lavigne",
			audioPath:"/mp3/c0984bf089f7e7534d6c838fd4204cc40ed87368.mp3",
		});
		allTracks.push({
			id:"f48d5786b2115ef778856979ab8823072c0d8a7c",
			enabled:false,
			name:"Total Eclipse of the Heart",
			artist:"Bonnie Tyler",
			audioPath:"/mp3/f48d5786b2115ef778856979ab8823072c0d8a7c.mp3",
		});
		allTracks.push({
			id:"75d3d091213d60d9f3ed2c0698b846177076b0d0",
			enabled:false,
			name:"Careless Whisper",
			artist:"George Michael",
			audioPath:"/mp3/75d3d091213d60d9f3ed2c0698b846177076b0d0.mp3",
		});
		allTracks.push({
			id:"5299497db5ba226f388f3a064064cc44b2b51568",
			enabled:false,
			name:"Gangsta's Paradise",
			artist:"Coolio",
			audioPath:"/mp3/5299497db5ba226f388f3a064064cc44b2b51568.mp3",
		});
		allTracks.push({
			id:"48a875fc1117e0c027571813c3c65b7c4fe52cfa",
			enabled:false,
			name:"Wonderwall",
			artist:"Oasis",
			audioPath:"/mp3/48a875fc1117e0c027571813c3c65b7c4fe52cfa.mp3",
		});
		allTracks.push({
			id:"a0aaadd12a0a4c8d925411ed687e5aa0145b2a22",
			enabled:false,
			name:"Every Breath You Take",
			artist:"The Police",
			audioPath:"/mp3/a0aaadd12a0a4c8d925411ed687e5aa0145b2a22.mp3",
		});
		allTracks.push({
			id:"4929799672010ba499c49392f6007f3f017325a4",
			enabled:false,
			name:"Born in the U.S.A.",
			artist:"Bruce Springsteen",
			audioPath:"/mp3/4929799672010ba499c49392f6007f3f017325a4.mp3",
		});
		allTracks.push({
			id:"d1c143357d86d1736806ed7404b71a44feb8451d",
			enabled:false,
			name:"Wake Me up Before You Go-Go",
			artist:"Wham!",
			audioPath:"/mp3/d1c143357d86d1736806ed7404b71a44feb8451d.mp3",
		});
		allTracks = Utils.shuffle(allTracks);
		this.tracks = allTracks.concat();
		this.tracksMode = false;
		this.loading = true;
		this.complete = false;
		this.needUserInteraction = false;
		this.tracksToPlay = allTracks.splice(0, Config.MAX_TRACK_COUNT);
		this.audioPlayer.populate(this.tracksToPlay);
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public onLoadComplete():void {
		this.loading = false;
		this.isPlaying = true;
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
		// this.$router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
		let path = this.$router.resolve({name:"player/tracks", params:{tracksids:ids.join(",")}});
		Utils.copyToClipboard(window.location.protocol+"//"+window.location.host+path.href);
		this.shareUrl = window.location.protocol+"//"+window.location.host+path.href;
	}

	/**
	 * Called when "create a Multi Blindtest" button is click
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
	
	public togglePlayPause():void {
		if(this.isPlaying) {
			this.audioPlayer.pause();
		}else{
			this.audioPlayer.play();
		}
		this.isPlaying = !this.isPlaying;
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

		.complete, .playpause {
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
		max-width: 80vw;
		max-height: 80vw;
		padding: @size * .2;
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