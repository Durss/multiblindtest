<template>
	<div class="playlistselector">
		<BouncingLoader v-if="loading" class="loader" :icon="getIcon('home_logo')">
			<h1>{{t('playlists.loading.title')}}</h1>
			<p class="infos">{{t('playlists.loading.description')}}</p>
		</BouncingLoader>

		<div class="playlists" v-if="!loading">
			<div class="header">
				<img src="@/assets/icons/twitch.svg" alt="Twitch" class="icon" v-if="props.mode=='twitch'">
				<h1>{{t('playlists.title')}}</h1>
				<p>{{t('playlists.subtitle')}}</p>
				<Button :title="t('playlists.refresh')"
					v-if="loadedFromCache"
					class="reload"
					:icon="getIcon('refresh')"
					@click="loadPlaylists()"
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

			<div class="header refused" v-if="refusedPlaylists.length > 0">{{t('playlists.noTrack')}}</div>

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
				:mode="props.mode"
				v-if="selectedPlaylists.length > 0"
				@start="startBlindtest()"
				ref="footer"
			/>
		</transition>
	</div>
</template>
<script setup lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from '@/components/Button.vue';
import PlayListEntry from '@/components/PlayListEntry.vue';
import PlaylistSelectorFooter from '@/components/PlaylistSelectorFooter.vue';
import { useStoreMain } from "@/store";
import Api from "@/utils/Api";
import { getIcon } from "@/utils/Icons";
import SpotifyAPI from "@/utils/SpotifyAPI";
import PlaylistData from "@/vo/PlaylistData";
import TrackData from '@/vo/TrackData';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import NoPlaylist from '../components/NoPlaylist.vue';
import SearchPlaylistForm from '../components/SearchPlaylistForm.vue';

const props = defineProps<{
	mode?:string;
}>();

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const footer = useTemplateRef<InstanceType<typeof PlaylistSelectorFooter>>("footer");

let minTracksPerPlaylist:number = 1;

const playlists = ref<PlaylistData[]>([]);
const loading = ref<boolean>(false);
let disposed:boolean = false;
const loadedFromCache = ref<boolean>(false);
const selectedPlaylists = ref<any[]>([]);
const numberOfTracks = ref<number>(0);

const filteredPlaylists = computed(():PlaylistData[] => {
	let list = playlists.value.concat();
	list.sort((a:PlaylistData, b:PlaylistData)=> {
		if(a.searchOrigin && !b.searchOrigin) return -1;
		if(!a.searchOrigin && b.searchOrigin) return 1;
		if(a.tracks.length > b.tracks.length) return -1;
		if(a.tracks.length > b.tracks.length) return 1;
		return 0;
	})
	for (let i = 0; i < list.length; i++) {
		const p = list[i];
		if(p.tracks.length < minTracksPerPlaylist && !p.searchOrigin) {
			list.splice(i,1);
			i--;
		}
	}
	return list;
});

const refusedPlaylists = computed(():PlaylistData[] => {
	let list = playlists.value.concat();
	list.sort((a:PlaylistData, b:PlaylistData)=> {
		if(a.tracks.length > b.tracks.length) return -1;
		if(a.tracks.length > b.tracks.length) return 1;
		return 0;
	})
	for (let i = 0; i < list.length; i++) {
		const p = list[i];
		if(p.tracks.length >= minTracksPerPlaylist || p.searchOrigin) {
			list.splice(i,1);
			i--;
		}
	}
	return list;
});

onMounted(() => {
	if(storeMain.playlistsCache) {
		playlists.value = storeMain.playlistsCache;
		loadedFromCache.value = true;
	}else{
		loadPlaylists();
	}
});

onBeforeUnmount(() => {
	disposed = true;
});

/**
 * Loads playlists, covers and tracks from spotify
 */
async function loadPlaylists(offset:number = 0):Promise<void> {
	if(offset==0) {
		playlists.value = [];
		selectedPlaylists.value = [];
	}
	let playlistsPerBatch = 50;
	loading.value = true;
	//Load a batch of playlists
	let json = await SpotifyAPI.instance.call("v1/me/playlists", {offset:(offset*playlistsPerBatch), limit:playlistsPerBatch});
	for (let i = 0; i < json.items.length; i++) {
		if(disposed) return;
		//Load tracks from the playlists
		const p = json.items[i];
		let tracksResult, offset=0;
		let tracksWithPreview:TrackData[] = [];
		let jsonCover = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/images");
		do {
			//Load a batch of tracks of the current playlist
			tracksResult = await SpotifyAPI.instance.call("v1/playlists/"+p.id+"/tracks", {offset, limit:100});

			for (let j = 0; j < tracksResult.items.length; j++) {
				if(disposed) return;
				let track = tracksResult.items[j].track;
				if(!track) continue;
				if(track.preview_url) {
					let trackInfos:TrackData = {
						id:track.id,
						enabled:false,
						name:track.name,
						artist:track.artists[0].name,
						album:track.album?.name,
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
		cover:jsonCover && jsonCover.length > 0? jsonCover[0].url : getIcon('playlist'),
		tracks:tracksWithPreview,
	};			playlists.value.push(data);
	}

	if(json.next) {
		//Load next page
		loadPlaylists(offset+1);
	}else{
		loading.value = false;
		// storeMain.setPlaylistsCache(playlists.value);
	}
}

/**
 * Called anytime playlists changes.
 * Caches the playlists to the store.
 */
watch(playlists, (newValue, oldValue) => {
	storeMain.setPlaylistsCache(playlists.value);
}, {immediate: false, deep:true});

/**
 * Called when clicking a playlist.
 * Toggles its selection state
 */
async function selectPlaylist(data:PlaylistData):Promise<any> {
	if(data.processingTracks) return;

	for (let i = 0; i < selectedPlaylists.value.length; i++) {
		if(selectedPlaylists.value[i].id == data.id) {
			selectedPlaylists.value.splice(i, 1);
			return;
		}

	}
	selectedPlaylists.value.push(data);
}

/**
 * Starts the multi blindtest
 */
async function startBlindtest():Promise<any> {
	if(props.mode == "solo") {
		let ids = selectedPlaylists.value.map(p => p.id);
		let trackscounts = footer.value.tracksCount.toString();
		router.push({name:"player/playlists", params:{playlistids:ids.join(","), trackscounts}});

	}else if(props.mode == "twitchExt" || props.mode == "twitchObs") {
		let ids = selectedPlaylists.value.map(p => p.id);
		router.push({name:"twitch/lobby", params:{playlistids:ids.join(","), mode:props.mode}});

	}else{
		let list = JSON.parse(JSON.stringify(selectedPlaylists.value));
		list.forEach(p => delete p.tracks);
		let data = {
			playlists:list,
			tracksCounts: footer.value.tracksCount.toString(),
		}
		let res = await Api.post("group/create", data);
		router.push({name:"group", params:{id:res.roomId}});
	}
}

function onDeletePlaylist(data:PlaylistData):void {
	//delete from local cache
	for (let i = 0; i < playlists.value.length; i++) {
		const p = playlists.value[i];
		if(p.id == data.id) {
			playlists.value.splice(i, 1);
		}
	}

	//delete from selected list
	for (let i = 0; i < selectedPlaylists.value.length; i++) {
		const p = selectedPlaylists.value[i];
		if(p.id == data.id) {
			selectedPlaylists.value.splice(i, 1);
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
		:deep(.icon) {
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
		&.slide-enter-from, &.slide-leave-to {
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