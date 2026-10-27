<template>
	<div class="playlistselectorfooter">
		<div class="playlists">
			<img src="@/assets/icons/playlist.svg" alt="check">
			<span>{{t('playlists.footer.playlistCount', {count:props.playlists.length})}}</span>
		</div>

		<div class="tracks">
			<img src="@/assets/icons/song.svg" alt="check">
			<span>{{t('playlists.footer.tracksCount', {count:totalTracks})}}</span>
		</div>

		<Slider v-if="props.mode == 'solo'" class="slider" :label="t('playlists.footer.difficulty')" :min="1" :max="maxTracks" v-model="tracksCount" />

		<div class="min" v-if="totalTracks < 20">{{t('playlists.footer.notEnough')}}</div>

		<div class="buttons">
			<Button :title="t('playlists.footer.start')" big class="submit" @click="startBlindtest()" white v-if="totalTracks >= 20" />
		</div>
	</div>
</template>
<script setup lang="ts">
import Button from '@/components/Button.vue';
import Slider from '@/components/Slider.vue';
import PlaylistData from '@/vo/PlaylistData';
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Config from '../utils/Config';

const props = withDefaults(defineProps<{
	playlists?:PlaylistData[];
	mode?:string;
}>(), {
	playlists:null,
});

const emit = defineEmits<{
	start:[];
}>();

const { t } = useI18n();

const tracksCount = ref<number>(4);

const maxTracks = computed(():number => { return Config.MAX_TRACK_COUNT; });

const totalTracks = computed(():number => {
	let res = 0;
	for (let i = 0; i < props.playlists.length; i++) {
		const p = props.playlists[i];
		res += p.tracks.length;
	}
	return res;
});

function startBlindtest():void {
	emit("start");
}

defineExpose({ tracksCount });

</script>

<style scoped lang="less">
.playlistselectorfooter{
	padding: 15px 0;
	color: #fff;
	font-weight: bold;
	background-color: @mainColor_warn;
	border-top: 1px solid #fff;

	.playlists, .tracks {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;

		img {
			height: 24px;
			margin-right: 10px;
		}

		&:not(:last-child) {
			margin-bottom: 5px;
		}
	}

	.slider {
		width: 100%;
		max-width: 500px;
		margin: auto;
		margin-top: 20px;
	}

	.min {
		font-family: "Futura";
		background-color: rgba(255,0,0,.5);
		color: white;
		padding: 10px;
		display: inline-block;
		border-radius: 20px;
		// opacity: .5;
		margin: 10px;
	}

	.buttons {
		margin-top: 5px;
		.button {
			color: @mainColor_warn;
		}
		.submit {
			padding: 20px 40px;
		}
	}
}


@media only screen and (max-width: 500px) {
	.playlistselectorfooter {
		padding: 10px;
		.playlists, .tracks {
			font-size: 16px;
			img {
				height: 18px;
				margin-right: 7px;
			}
		}
	}
}
</style>