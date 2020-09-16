<template>
	<div class="mixcreator">
		<div class="header">
			<h1>{{$t('create.title')}}</h1>
			<p class="infos" v-html="$t('create.subtitle', {tracksCount:tracksCount})"></p>
		</div>

		<AutoCompleteForm searchType="track" v-if="selectedTracks.length < tracksCount" :filteredItems="selectedTracks" @select="onSelectTrack" />

		<div class="selectedTracks" v-if="selectedTracks.length > 0">
			<div class="title">{{$t('create.selected')}}</div>
			<div class="trackItem" v-for="(t, index) in selectedTracks" :key="t.id+'_'+index">
				<SearchTrackResultItem :data="t" class="track" />
				<Button :icon="require('@/assets/icons/stop_square.svg')" class="stopBt" @click="stopTrack(t)" v-if="t.isPlaying" />
				<Button :icon="require('@/assets/icons/delete.svg')" highlight class="deleteBt" @click="removeTrack(t)" />
			</div>
		</div>

		<div class="actions">
			<Button :icon="require('@/assets/icons/'+(testing? 'stop_square' : 'play')+'.svg')" :title="$t('create.testBt')" :disabled="selectedTracks.length == 0" @click="testMix()" :loading="loadingAudio" />
			<Button :icon="require('@/assets/icons/checkmark_white.svg')" :title="$t('create.createBt')" :disabled="selectedTracks.length < 2" highlight @click="submitMix()" />
		</div>

		<div class="help">
			<button class="title" @click="expandHelp=!expandHelp">{{$t('create.help.title')}}</button>
			<div class="expand" v-if="expandHelp" v-html="$t('create.help.description')"></div>
		</div>

		<VolumeButton />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SpotifyAPI from '@/utils/SpotifyAPI';
import InfiniteList from '@/components/InfiniteList';
import TrackData from '@/vo/TrackData';
import SearchTrackResultItem from '@/components/SearchTrackResultItem.vue';
import Button from '@/components/Button.vue';
import Config from '@/utils/Config';
import AudioPlayer from '../components/AudioPlayer';
import VolumeButton from '../components/VolumeButton.vue';
import Utils from '../utils/Utils';
import AutoCompleteForm from '../components/AutoCompleteForm.vue';

@Component({
	components:{
		Button,
		VolumeButton,
		AutoCompleteForm,
		SearchTrackResultItem,
	}
})
export default class MixCreator extends Vue {

	public testing:boolean = false;
	public expandHelp:boolean = false;
	public loadingAudio:boolean = false;
	public selectedTracks:TrackData[] = [];
	
	private audioPlayer:AudioPlayer;

	public get tracksCount():number { return Config.MAX_TRACK_COUNT; }

	public mounted():void {
		this.audioPlayer = new AudioPlayer(Config.MAX_TRACK_COUNT);
		this.audioPlayer.onLoadComplete = () => this.loadingAudio = false;
	}

	public beforeDestroy():void {
		this.audioPlayer.stopAll();
		this.audioPlayer.dispose();
	}

	/**
	 * Removes a track from the list
	 */
	public removeTrack(data:TrackData):void {
		for (let i = 0; i < this.selectedTracks.length; i++) {
			const t = this.selectedTracks[i];
			if(t.id == data.id) {
				this.selectedTracks.splice(i, 1);
				break;
			}
		}
		this.audioPlayer.stopTrack(data);
	}

	/**
	 * Stops a specific track
	 */
	public stopTrack(t:TrackData):void {
		t.isPlaying = false;
		this.audioPlayer.stopTrack(t);
		for (let i = 0; i < this.selectedTracks.length; i++) {
			if(this.selectedTracks[i].isPlaying) return;
		}
		this.testing = false;
	}

	/**
	 * Start mix testing
	 */
	public testMix():void {
		if(this.testing) {
			this.audioPlayer.stopAll();
			this.testing = false;
			return;
		}
		this.testing = true;
		this.loadingAudio = true;
		this.audioPlayer.populate(this.selectedTracks);
		for (let i = 0; i < this.selectedTracks.length; i++) {
			this.selectedTracks[i].isPlaying = true;
		}
	}

	/**
	 * Submits the mix
	 */
	public submitMix():void {
		let ids = this.selectedTracks.map(t => t.id);
		this.$router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
	}

	@Watch("$store.state.volume", {immediate: true, deep:true})
	public onVolumeChange(a, b):void {
		if(!this.audioPlayer) return;
		this.audioPlayer.volume = this.$store.state.volume;
	}

	/**
	 * Called when a track is selected on auto complete form
	 */
	public onSelectTrack(track:TrackData):void {
		this.selectedTracks.push(track);
	}

}
</script>

<style scoped lang="less">
.mixcreator{
	max-width: 90%;
	margin: auto;
	position: relative;
	.header {
		text-align: center;
		h1 {
			margin-bottom: 10px;
		}
	}

	.help {
		margin: auto;
		display: block;
		width: min-content;
		margin-top: 30px;
		.title {
			margin: auto;
			display: block;
			background-color: @mainColor_warn;
			padding: 3px 8px;
			white-space: nowrap;
			cursor: pointer;
			font-weight: normal;
			font-family: "FuturaLight";
			opacity: 1;
			&:hover {
				color: @mainColor_warn;
				background-color: #fff;
			}
		}
		.expand {
			margin-top: 10px;
			width: 400px;
			padding: 10px;
			border-radius: 10px;
			background-color: fade(#fff, 50%);
		}
	}

	.selectedTracks {
		display: flex;
		flex-direction: column;
		margin-top: 30px;

		.title {
			font-size: 20px;
			font-weight: bold;
			margin-bottom: 5px;
		}

		.trackItem {
			display: flex;
			flex-direction: row;
			margin-bottom: 5px;
			.track {
				flex-grow: 1;
				pointer-events: none;
			}
			.deleteBt, .stopBt {
				width: 40px;
				height: 40px;
				min-width: 40px;
				min-height: 40px;
			}
		}
	}

	.actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin-top: 30px;
		&>*:not(:last-child) {
			margin-right: 10px;
		}
	}
}
</style>