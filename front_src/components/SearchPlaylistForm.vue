<template>
	<div class="searchplaylistform">
		<AutoCompleteForm searchType="playlist" :filteredItems="props.modelValue" :maxResult="200" :maxSelectable="1" @select="onSelectPlaylist" />

		<!-- <SimpleLoader label="Analysing playlist's tracks..." /> -->
	</div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, reactive } from "vue";
import AutoCompleteForm from './AutoCompleteForm.vue';
import PlaylistData from '../vo/PlaylistData';
import SpotifyAPI from '../utils/SpotifyAPI';
import TrackData from '../vo/TrackData';

const props = defineProps<{
	modelValue?:PlaylistData[];
}>();

const emit = defineEmits<{
	"update:modelValue":[value:PlaylistData[]];
}>();

let disposed:boolean = false;

onBeforeUnmount(() => {
	disposed = true;
});

async function onSelectPlaylist(selectedPlaylist:PlaylistData):Promise<void> {
	//Work on the reactive version so updates made after it's
	//added to the list are rendered
	const playlist = reactive(selectedPlaylist);
	playlist.searchOrigin = true;
	playlist.processingTracks = true;

	emit("update:modelValue", props.modelValue.concat(playlist));

	//If playlist's tracks have not been loaded yet
	if(playlist.tracks.join("") == "") {
		let tracksResult, offset=0;
		let tracksWithPreview:TrackData[] = [];
		do {
			//Load a batch of tracks
			tracksResult = await SpotifyAPI.instance.call("v1/playlists/"+playlist.id+"/tracks", {offset, limit:100});

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
			playlist.tracks = tracksWithPreview;
			offset += tracksResult.limit

		//repeat while there are tracks
		}while(tracksResult.next);

		playlist.processingTracks = false;
	}
}

</script>

<style scoped lang="less">
.searchplaylistform{
	
}
</style>