<template>
	<div class="searchplaylistform">
		<AutoCompleteForm searchType="playlist" :filteredItems="value" maxResult="200" maxSelectable="1" @select="onSelectPlaylist" />

		<!-- <SimpleLoader label="Analysing playlist's tracks..." /> -->
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import AutoCompleteForm from './AutoCompleteForm.vue';
import PlaylistData from '../vo/PlaylistData';
import SpotifyAPI from '../utils/SpotifyAPI';
import TrackData from '../vo/TrackData';
import PlayListEntry from './PlayListEntry.vue';
import SimpleLoader from './SimpleLoader.vue';

@Component({
	components:{
		SimpleLoader,
		PlayListEntry,
		AutoCompleteForm,
	}
})
export default class SearchPlaylistForm extends Vue {

	@Prop()
	public value:PlaylistData[];

	public disposed:boolean = false;

	public mounted():void {
		
	}

	public beforeDestroy():void {
		this.disposed = true;
	}

	private async onSelectPlaylist(playlist:PlaylistData):Promise<void> {
		playlist.searchOrigin = true;
		playlist.processingTracks = true;

		this.$emit("input", this.value.concat(playlist));

		//If playlist's tracks have not been loaded yet
		if(playlist.tracks.join("") == "") {
			let tracksResult, offset=0;
			let tracksWithPreview:TrackData[] = [];
			do {
				//Load a batch of tracks
				tracksResult = await SpotifyAPI.instance.call("v1/playlists/"+playlist.id+"/tracks", {offset, limit:100});
				
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
				Vue.set(playlist, "tracks", tracksWithPreview);
				offset += tracksResult.limit

			//repeat while there are tracks
			}while(tracksResult.next);

			Vue.set(playlist, "processingTracks", false);
		}
	}

}
</script>

<style scoped lang="less">
.searchplaylistform{
	
}
</style>