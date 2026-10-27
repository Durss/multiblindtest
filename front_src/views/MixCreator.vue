<template>
	<div class="mixcreator">
		<div class="header">
			<h1>{{t('create.title')}}</h1>
			<p class="infos" v-html="t('create.subtitle', {tracksCount:tracksCount})"></p>
		</div>

		<AutoCompleteForm searchType="track" v-if="selectedTracks.length < tracksCount" :filteredItems="selectedTracks" @select="onSelectTrack" />

		<div class="selectedTracks" v-if="selectedTracks.length > 0">
			<div class="title">{{t('create.selected')}}</div>
			<div class="trackItem" v-for="(t, index) in selectedTracks" :key="t.id+'_'+index">
				<SearchTrackResultItem :data="t" class="track" />
				<Button :icon="getIcon('stop_square')" class="stopBt" @click="stopTrack(t)" v-if="t.isPlaying" />
				<Button :icon="getIcon('delete')" highlight class="deleteBt" @click="removeTrack(t)" />
			</div>
		</div>

		<div class="actions">
			<Button :icon="getIcon(testing? 'stop_square' : 'play')" :title="t('create.testBt')" :disabled="selectedTracks.length == 0" @click="testMix()" :loading="loadingAudio" />
			<Button :icon="getIcon('checkmark_white')" :title="t('create.createBt')" :disabled="selectedTracks.length < 2" highlight @click="submitMix()" />
		</div>

		<div class="help">
			<button class="title" @click="expandHelp=!expandHelp">{{t('create.help.title')}}</button>
			<div class="expand" v-if="expandHelp" v-html="t('create.help.description')"></div>
		</div>

		<VolumeButton />
	</div>
</template>
<script setup lang="ts">
import Button from '@/components/Button.vue';
import SearchTrackResultItem from '@/components/SearchTrackResultItem.vue';
import { useStoreMain } from '@/store';
import Config from '@/utils/Config';
import { getIcon } from '@/utils/Icons';
import TrackData from '@/vo/TrackData';
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AudioPlayer from '../components/AudioPlayer';
import AutoCompleteForm from '../components/AutoCompleteForm.vue';
import VolumeButton from '../components/VolumeButton.vue';

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const testing = ref<boolean>(false);
const expandHelp = ref<boolean>(false);
const loadingAudio = ref<boolean>(false);
const selectedTracks = ref<TrackData[]>([]);

let audioPlayer:AudioPlayer;

const tracksCount = computed(():number => { return Config.MAX_TRACK_COUNT; });

onMounted(() => {
	audioPlayer = new AudioPlayer(Config.MAX_TRACK_COUNT);
	audioPlayer.onLoadComplete = () => loadingAudio.value = false;
});

onBeforeUnmount(() => {
	audioPlayer.stopAll();
	audioPlayer.dispose();
});

/**
 * Removes a track from the list
 */
function removeTrack(data:TrackData):void {
	for (let i = 0; i < selectedTracks.value.length; i++) {
		const t = selectedTracks.value[i];
		if(t.id == data.id) {
			selectedTracks.value.splice(i, 1);
			break;
		}
	}
	audioPlayer.stopTrack(data);
}

/**
 * Stops a specific track
 */
function stopTrack(t:TrackData):void {
	t.isPlaying = false;
	audioPlayer.stopTrack(t);
	for (let i = 0; i < selectedTracks.value.length; i++) {
		if(selectedTracks.value[i].isPlaying) return;
	}
	testing.value = false;
}

/**
 * Start mix testing
 */
function testMix():void {
	if(testing.value) {
		audioPlayer.stopAll();
		testing.value = false;
		return;
	}
	testing.value = true;
	loadingAudio.value = true;
	audioPlayer.populate(selectedTracks.value);
	for (let i = 0; i < selectedTracks.value.length; i++) {
		selectedTracks.value[i].isPlaying = true;
	}
}

/**
 * Submits the mix
 */
function submitMix():void {
	let ids = selectedTracks.value.map(t => t.id);
	router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
}

watch(() => storeMain.volume, () => {
	if(!audioPlayer) return;
	audioPlayer.volume = storeMain.volume;
}, {immediate: true});

/**
 * Called when a track is selected on auto complete form
 */
function onSelectTrack(track:TrackData):void {
	selectedTracks.value.push(track);
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