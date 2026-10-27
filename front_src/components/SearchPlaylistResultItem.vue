<template>
	<div class="SearchTrackResultItem" v-if="props.data" :class="props.selected? 'hover': ''">
		<img :src="picture" alt="track" class="icon">
		<span class="tracks">
			<img src="@/assets/icons/song.svg" alt="song">x
			<span>{{props.data.tracks.length}}</span>
		</span>
		<div class="label">
			<span class="titme">{{props.data.name}}</span>
			<span class="owner">{{owner}}</span>
		</div>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import PlaylistData from '../vo/PlaylistData';

const props = defineProps<{
	data?:PlaylistData;
	selected?:boolean;
}>();

const { t } = useI18n();

const picture = computed(():string => {
	if(props.data.cover) return props.data.cover;
	return getIcon('playlist');
});

const owner = computed(():string => {
	return t('playlists.owner', {owner:props.data.owner});
});

</script>

<style scoped lang="less">
.SearchTrackResultItem{
	display:flex;
	align-items:center;
	// justify-content: flex-start;
	width: 100%;
	height: 40px;
	padding: 0 10px;
	font-size: 18px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	box-sizing: border-box;
	position: relative;

	cursor: pointer;
	&:hover, &.hover {
		background-color: @mainColor_normal;
		color: #fff;
	}

	.tracks {
		background-color: @mainColor_dark;
		color: #fff;
		font-size: 14px;
		padding: 3px 6px;
		border-radius: 10px;
		img {
			height: 14px;
			margin-right: 5px;
		}
	}

	.label {
		display: flex;
		flex-direction: column;
		width: calc(100% - 55px);
		.owner {
			font-size: 12px;
			opacity: .7;
			text-transform: uppercase;
		}
		.title, .owner {
			overflow: hidden;
			text-overflow: ellipsis;
			width: 100%;
			font-weight: bold;
		}
	}

	.icon {
		width: 35px;
		min-width: 35px;
		height: 35px;
		margin-right:10px;
		object-fit: cover;
		border-radius: 50%;
	}
}

@media only screen and (max-width: 500px) {
	.SearchTrackResultItem {
		font-size: 16px;
	}
}
</style>