<template>
	<div class="SearchTrackResultItem" v-if="props.data" :class="props.selected? 'hover': ''">
		<img :src="picture" alt="track" class="icon">
		<div class="label">
			<span class="artist">{{props.data.artist}}</span>
			<span class="title">{{props.data.name}}</span>
		</div>
	</div>
</template>
<script setup lang="ts">
import TrackData from '@/vo/TrackData';
import { getIcon } from '@/utils/Icons';
import { computed } from "vue";

const props = defineProps<{
	data?:TrackData;
	selected?:boolean;
}>();

const picture = computed(():string => {
	if(props.data.picture) return props.data.picture;
	return getIcon('song');
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

	.label {
		display: flex;
		flex-direction: column;
		width: calc(100% - 55px);
		.artist {
			font-size: 12px;
			opacity: .7;
			text-transform: uppercase;
		}
		.title, .artist {
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