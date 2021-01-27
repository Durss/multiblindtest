<template>
	<div class="playlistselector">
		<BouncingLoader v-if="loading" class="loader" :icon="require('@/assets/icons/home_logo.svg')">
			<h1>{{$t('playlists.loading.title')}}</h1>
			<p class="infos">{{$t('playlists.loading.description')}}</p>
		</BouncingLoader>

		<div class="playlists" v-if="!loading">
			<div class="header">
				<img src="@/assets/icons/twitch.svg" alt="Twitch" class="icon" v-if="mode=='twitch'">
				<h1>{{$t('playlists.title')}}</h1>
				<p>{{$t('playlists.subtitle')}}</p>
				<Button :title="$t('playlists.refresh')"
					v-if="loadedFromCache"
					class="reload"
					:icon="require('@/assets/icons/refresh.svg')"
					@click="load()"
				/>
			</div>

			<SearchPlaylistForm class="searchForm" v-model="playlists" />

			<PlayListEntry
				v-for="p in filteredPlaylists"
				:key="p.id"
				:data="p"
				class="playlist"
				@select="selectPlaylist(p)"
				@delete="onDeletePlaylist"
			/>

			<NoPlaylist v-if="filteredPlaylists.length == 0" />

			<div class="header refused" v-if="refusedPlaylists.length > 0">{{$t('playlists.noTrack')}}</div>

			<PlayListEntry
				v-for="p in refusedPlaylists"
				:key="p.id"
				:data="p"
				reduced
				class="playlist"
			/>
		</div>

		<transition name="slide">
			<PlaylistSelectorFooter class="footer"
				:playlists="selectedPlaylists"
				:mode="mode"
				v-if="selectedPlaylists.length > 0"
				@start="startBlindtest()"
				ref="footer"
			/>
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
import NoPlaylist from '../components/NoPlaylist.vue';
import SearchPlaylistForm from '../components/SearchPlaylistForm.vue';
import BouncingLoader from "@/components/BouncingLoader.vue";

@Component({
	components:{
		Button,
		NoPlaylist,
		PlayListEntry,
		BouncingLoader,
		SearchPlaylistForm,
		PlaylistSelectorFooter,
	}
})
export default class PlaylistSelector extends Vue {

	@Prop()
	public mode:string;

	private minTracksPerPlaylist:number = 1;

	public playlists:PlaylistData[] = [];
	public loading = false;
	public disposed = false;
	public loadedFromCache = false;
	public selectedPlaylists:any[] = [];
	public numberOfTracks:number = 0;

	public get filteredPlaylists():PlaylistData[] {
		let playlists = this.playlists.concat();
		playlists.sort((a:PlaylistData, b:PlaylistData)=> {
			if(a.searchOrigin && !b.searchOrigin) return -1;
			if(!a.searchOrigin && b.searchOrigin) return 1;
			if(a.tracks.length > b.tracks.length) return -1;
			if(a.tracks.length > b.tracks.length) return 1;
			return 0;
		})
		for (let i = 0; i < playlists.length; i++) {
			const p = playlists[i];
			if(p.tracks.length < this.minTracksPerPlaylist && !p.searchOrigin) {
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
			if(p.tracks.length >= this.minTracksPerPlaylist || p.searchOrigin) {
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
	}

	public beforeDestroy():void {
		this.disposed = true;
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
			if(this.disposed) return;
			//Load tracks from the playlists 
			const p = json.items[i];
			let tracksResult, offset=0;
			let tracksWithPreview:TrackData[] = [];
			let jsonCover = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/images");
			do {
				//Load a batch of tracks of the current playlist
				tracksResult = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/tracks", {offset, limit:100});
				
				for (let j = 0; j < tracksResult.items.length; j++) {
					if(this.disposed) return;
					let track = tracksResult.items[j].track;
					if(!track) continue;
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
			// this.$store.dispatch("playlistsCache", this.playlists);
		}
	}

	/**
	 * Called anytime playlists changes.
	 * Caches the playlists to the store.
	 */
	@Watch("playlists", {immediate: false, deep:true})
	public onUpdatePlaylists(newValue, oldValue):void {
		this.$store.dispatch("playlistsCache", this.playlists);
	}

	/**
	 * Called when clicking a playlist.
	 * Toggles its selection state
	 */
	public async selectPlaylist(data:PlaylistData):Promise<any> {
		if(data.processingTracks) return;

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
		if(this.mode == "solo") {
			let ids = this.selectedPlaylists.map(p => p.id);
			let trackscounts = (<PlaylistSelectorFooter>this.$refs["footer"]).tracksCount.toString();
			this.$router.push({name:"player/playlists", params:{playlistids:ids.join(","), trackscounts}});
			
		}else if(this.mode == "twitchExt" || this.mode == "twitchObs") {
			let ids = this.selectedPlaylists.map(p => p.id);
			let trackscounts = (<PlaylistSelectorFooter>this.$refs["footer"]).tracksCount.toString();
			this.$router.push({name:"twitch/lobby", params:{playlistids:ids.join(","), trackscounts, mode:this.mode}});

		}else{
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

	public onDeletePlaylist(data:PlaylistData):void {
		//delete from local cache
		for (let i = 0; i < this.playlists.length; i++) {
			const p = this.playlists[i];
			if(p.id == data.id) {
				this.playlists.splice(i, 1);
			}
		}

		//delete from selected list
		for (let i = 0; i < this.selectedPlaylists.length; i++) {
			const p = this.selectedPlaylists[i];
			if(p.id == data.id) {
				this.selectedPlaylists.splice(i, 1);
			}
		}
	}

}
</script>

<style scoped lang="less">
.playlistselector{
	margin: auto;
	width: auto;
	text-align: center;
	max-width: 500px;
	padding-bottom: 150px;

	.loader {
		.center();
		position: absolute;
		/deep/ .icon {
			top: 12px;
			width: 70px;
			height: 70px;
		}
	}

	.header {
		.icon {
			height: 50px;
		}
		h1 {
			margin-bottom: 10px;
		}
		
		&.refused {
			margin-top: 70px;
		}
	}

	.searchForm {
		margin-bottom: 20px;
	}

	.playlists {
		display: flex;
		flex-direction: column;
		margin: auto;

		.reload {
			margin: auto;
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
		.loader {
			width: 80vw;
		}
	}
}
</style>