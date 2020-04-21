<template>
	<div class="playlistselector">
		<div class="loader" v-show="loading">
			<img src="@/assets/loader/loader.svg" alt="loader" class="spinner">
			<img src="@/assets/icons/home_logo.svg" alt="loader" class="logo" ref="logo">
			<h1>Loading your playlists</h1>
			<p class="infos">This operation may take a while depending on the number of playlists and songs you have as it's scanning for all the song that spotify actually allows to be played</p>
		</div>

		<div class="playlists" v-if="!loading">
			<div class="header">
				<h1>Select playlists</h1>
				<p>Select playlists from which you want songs to be picked up randomly for your Multi Blindtest</p>
				<div class="or"><strong>OR</strong></div>
				<Button title="Create from tracks" :icon="require('@/assets/icons/song.svg')" :to="{name:'create'}" />
			</div>

			<PlayListEntry
				v-for="p in filteredPlaylists"
				:key="p.id"
				:data="p"
				class="playlist"
				@click.native="selectPlaylist(p)"
			/>

			<div v-if="filteredPlaylists.length == 0" class="noPlaylist">
				You have no playlist available on your Spotify account. Create one or subscribe to some then click <strong>Reload</strong> button bellow.<br />
				<br />
				Here are some suggestions you can subscribe to :<br />
				<ul class="list">
					<li><a class="button" href="https://open.spotify.com/playlist/1kTNITnvHTzXc6iPjr9KYy?si=Mt49vXMwRii8gXtTcWR52g" target="_blank">BlindRest Disney</a></li>
					<li><a class="button" href="https://open.spotify.com/playlist/1WA7caAqdAWUG3X9nc1yaC?si=RexC42-VRHuSUZVreMCEfQ" target="_blank">BlindRest : Movie</a></li>
					<li><a class="button" href="https://open.spotify.com/playlist/4qBM20gJ3G758ygaB3mFMc?si=sh8xZ8-aQMahAmcocC3UIw" target="_blank">BlindTest : Movies, series, cartoons and video games</a></li>
					<li><a class="button" href="https://open.spotify.com/playlist/4lcGPW6HrBRdFropnYJQiE?si=gEhEq_CDS1KbrIphQuje5A" target="_blank">BlindTest 90-2000</a></li>
					<li><a class="button" href="https://open.spotify.com/playlist/7IYEknPtHEOnmzAz3arfoG?si=gGPCv4SVQvO32jHW3WmUuA" target="_blank">BlindRest/Karaoké pour torturer tes voisin-e-s</a></li>
					<li><a class="button" href="https://open.spotify.com/playlist/09BfWHr6tID8xqOpDy0W4t?si=J98RJ-s9QUWApYRmKFWtAg" target="_blank">Mega Blindtest</a></li>
				</ul>
			</div>
			
			<Button title="Reload"
				v-if="loadedFromCache"
				class="reload"
				:icon="require('@/assets/icons/refresh.svg')"
				data-tooltip="Reload all your playlists"
				@click="load()"
			/>

			<div class="header refused" v-if="refusedPlaylists.length > 0">
				<p>Following playlist(s) don't have enough playable tracks</p>
			</div>

			<PlayListEntry
				v-for="p in refusedPlaylists"
				:key="p.id"
				:data="p"
				reduced
				class="playlist"
				@click.native="selectPlaylist(p)"
			/>
		</div>

		<transition name="slide">
			<PlaylistSelectorFooter class="footer"
			:playlists="selectedPlaylists"
			v-if="selectedPlaylists.length > 0"
			@start="startBlindtest()"
			@startGrouped="startGroupedBlindtest()"
			ref="footer" />
		</transition>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Api from "@/utils/Api";
import Utils from "@/utils/Utils";
import SpotifyAPI from "@/utils/SpotifyAPI";
import PlaylistData from "@/vo/PlaylistData";
import PlayListEntry from '@/components/PlayListEntry.vue';
import Button from '@/components/Button.vue';
import TrackData from '@/vo/TrackData';
import PlaylistSelectorFooter from '@/components/PlaylistSelectorFooter.vue';
import gsap from 'gsap';
import { v4 as uuidv4 } from 'uuid';

@Component({
	components:{
		Button,
		PlayListEntry,
		PlaylistSelectorFooter,
	}
})
export default class PlaylistSelector extends Vue {

	private minTracksPerPlaylist:number = 1;

	public playlists:PlaylistData[] = [];
	public loading = false;
	public loadedFromCache = false;
	public selectedPlaylists:any[] = [];
	public numberOfTracks:number = 0;

	public get filteredPlaylists():PlaylistData[] {
		let playlists = this.playlists.concat();
		playlists.sort((a:PlaylistData, b:PlaylistData)=> {
			if(a.tracks.length > b.tracks.length) return -1;
			if(a.tracks.length > b.tracks.length) return 1;
			return 0;
		})
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
			if(p.tracks.length < this.minTracksPerPlaylist) {
				playlists.splice(i,1);
				i--;
			}
		}
		return playlists;
	}

	public get refusedPlaylists():PlaylistData[] {
		let playlists = this.playlists.concat();
		playlists.sort((a:PlaylistData, b:PlaylistData)=> {
			if(a.tracks.length > b.tracks.length) return -1;
			if(a.tracks.length > b.tracks.length) return 1;
			return 0;
		})
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
			if(p.tracks.length >= this.minTracksPerPlaylist) {
				playlists.splice(i,1);
				i--;
			}
		}
		return playlists;
	}

	public mounted():void {
		if(this.$store.state.playlistsCache) {
			this.playlists = this.$store.state.playlistsCache;
			this.loadedFromCache = true;
		}else{
			this.load();
		}

		this.$nextTick().then(()=>{
			gsap.from(this.$refs.logo, {duration: 1, ease:"Elastic.easeOut", scale:1.2, repeat:100}).yoyo(true);
		})
	}

	public beforeDestroy():void {

	}

	/**
	 * Loads playlists, covers and tracks from spotify
	 */
	public async load(offset:number = 0):Promise<void> {
		if(offset==0) {
			this.playlists = [];
			this.selectedPlaylists = [];
		}
		let playlistsPerBatch = 50;
		this.loading = true;
		//Load a batch of playlists
		let json = await SpotifyAPI.instance.call("v1/me/playlists", {offset:(offset*playlistsPerBatch), limit:playlistsPerBatch});
		for (let i = 0; i < json.items.length; i++) {
			//Load tracks from the playlists 
			const p = json.items[i];
			let tracksResult, offset=0;
			let tracksWithPreview:TrackData[] = [];
			let jsonCover = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/images");
			do {
				//Load a batch of tracks of the current playlist
				tracksResult = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/tracks", {offset, limit:100});
				
				for (let j = 0; j < tracksResult.items.length; j++) {
					let track = tracksResult.items[j].track;
					if(track.preview_url) {
						let trackInfos:TrackData = {
							id:track.id,
							enabled:false,
							name:track.name,
							artist:track.artists[0].name,
							audioPath:track.preview_url,
						};
						tracksWithPreview.push(trackInfos);
					}
				}
				offset += tracksResult.limit
			}while(tracksResult.next);

			let data = {
				id:p.id,
				name:p.name,
				owner:p.owner.display_name,
				cover:jsonCover && jsonCover.length > 0? jsonCover[0].url : require("@/assets/icons/playlist.svg"),
				tracks:tracksWithPreview,
			};
			
			this.playlists.push(data);
		}

		if(json.next) {
			//Load next page
			this.load(offset+1);
		}else{
			this.loading = false;
			this.$store.dispatch("playlistsCache", this.playlists);
		}
	}

	/**
	 * Called when clicking a playlist.
	 * Toggles its selection state
	 */
	public async selectPlaylist(data:PlaylistData):Promise<any> {
		for (let i = 0; i < this.selectedPlaylists.length; i++) {
			if(this.selectedPlaylists[i].id == data.id) {
				this.selectedPlaylists.splice(i, 1);
				return;
			}
			
		}
		this.selectedPlaylists.push(data);
	}

	/**
	 * Starts the multi blindtest
	 */
	public async startBlindtest():Promise<any> {
		let ids = this.selectedPlaylists.map(p => p.id);
		let trackscounts = (<PlaylistSelectorFooter>this.$refs["footer"]).tracksCount.toString();
		this.$router.push({name:"player/playlists", params:{playlistids:ids.join(","), trackscounts}});
	}

	/**
	 * Starts a grouped multi blindtest
	 */
	public async startGroupedBlindtest():Promise<any> {
		console.log(this.selectedPlaylists);
		let playlists = JSON.parse(JSON.stringify(this.selectedPlaylists));
		playlists.forEach(p => delete p.tracks);
		let data = {
			playlists,
			tracksCounts: (<PlaylistSelectorFooter>this.$refs["footer"]).tracksCount.toString(),
		}
		let res = await Api.post("group/create", data);
		this.$router.push({name:"group", params:{id:res.roomId}});
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.playlistselector{
	margin: auto;
	width: auto;
	text-align: center;
	max-width: 500px;
	padding-bottom: 150px;

	.header {
		h1 {
			margin-bottom: 10px;
		}
		
		.or {
			margin-top: 10px;
			margin-bottom: 10px;
		}

		&.refused {
			margin-top: 70px;
		}
	}

	.noPlaylist {
		background-color: @mainColor_warn;
		padding: 20px;
		color: #fff;
		border-radius: 20px;
		.list {
			margin-top: 20px;
			li {
				margin: 5px;
				a {
					display: block;
				}
			}
		}
	}

	.playlists {
		display: flex;
		flex-direction: column;
		margin: auto;

		.reload {
			align-self: center;
			margin-top: 20px;
			display: block;
		}

		.playlist {
			margin: auto;
			margin-bottom: 5px;
		}
	}

	.pager {
		align-items: center;
		justify-content: center;
		margin: 10px;
		display: flex;
		flex-direction: row;
		.pageIndex {
			margin: 0 20px;
		}
	}

	.loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: fixed;
		.center();
		transform: translate(-50%, -60%);

		.spinner {
			width: 100px;
			height: 100px;
		}

		.logo {
			position: absolute;
			top: 12px;
			width: 70px;
			height: 70px;
		}

		.infos {
			font-style: italic;
			margin-top: 20px;
		}
	}

	.footer {
		z-index: 1;
		display: block;
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translate(-50%);
		width: 100%;
		box-sizing: border-box;

		&.slide-enter-active, &.slide-leave-active {
			transition: all .5s;
		}
		&.slide-enter, &.slide-leave-to {
			transform: translate(-50%, 100%);
		}
	}
}

@media only screen and (max-width: 500px) {
	.playlistselector {
		width: 90%;
		.loader {
			width: 80vw;
		}
	}
}
</style>