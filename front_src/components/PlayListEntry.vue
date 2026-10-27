<template>
	<div :class="classes" @click="onClick($event)">
		<Button type="checkbox" v-model="selected" class="checkbox" v-if="!props.data.processingTracks" />
		<img src="@/assets/loader/loader_white.svg" alt="loader" v-if="props.data.processingTracks">

		<img :src="props.data.cover" class="cover" v-if="props.data.cover">

		<div class="title">
			<!-- <div v-if="props.reduced !== false" class="total" >{{props.data.tracks.length}}</div> -->
			<div class="label">{{props.data.name}}</div>
			<div v-if="props.reduced === false" class="owner">{{t('playlists.owner', {owner:props.data.owner})}}</div>
			<div v-if="props.reduced === false" class="total" :data-tooltip="t('playlists.playableTracksInfos')">{{t('playlists.playableTracks', {count:props.data.tracks.length})}}</div>
		</div>

		<Button class="deleteBt" :icon="getIcon('cross')" v-if="props.data.searchOrigin" @click="onClickDelete($event)" />
	</div>
</template>
<script setup lang="ts">
import PlaylistData from '@/vo/PlaylistData';
import { getIcon } from '@/utils/Icons';
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Utils from '../utils/Utils';
import Button from './Button.vue';

const props = withDefaults(defineProps<{
	data?:PlaylistData;
	reduced?:boolean;
}>(), {
	reduced:false,
});

const emit = defineEmits<{
	select:[];
	delete:[data:PlaylistData];
}>();

const { t } = useI18n();

const selected = ref<boolean>(false);

const classes = computed(():string[] => {
	let res = ["playlistentry"];
	if(selected.value) res.push("selected");
	if(props.reduced !== false) res.push("disabled");
	if(props.data.searchOrigin) res.push("fromSearch");
	return res;
});

function onClick(event):void {
	if(props.data.processingTracks) {
		selected.value = false;
	}else{
		selected.value = !selected.value
	}
	emit('select');
}

function onClickDelete(event:MouseEvent|TouchEvent):void {
	event.stopPropagation();//Avoid selection event being fired
	Utils.confirm(t("playlists.deleteConfirm"))
	.then(_=> {
		emit('delete', props.data);
	}).catch(e=>{/*ignore*/})
}

</script>

<style scoped lang="less">
.playlistentry{
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 15px;
	padding-left: 30px;
	border-radius: 40px;
	background-color: @mainColor_normal;
	width: 100%;
	box-sizing: border-box;
	cursor: pointer;

	// &>* {
	// 	pointer-events: none;
	// }

	&.selected {
		background-color: @mainColor_warn;
		&:hover {
			background-color: @mainColor_warn_light;
		}
	}

	&.disabled {
		pointer-events: none;
		opacity: .5;

		.cover {
			width: 25px;
			height: 25px;
		}

		.title {
			font-size: 18px;
			.label {
					display: inline;
			}
			.total {
				display: inline;
				padding: 2px 5px;
				margin-right: 10px;
			}
		}
	}

	&:hover {
		background-color: @mainColor_normal_light;
	}

	&.fromSearch:not(.selected) {
		background-color: @mainColor_light;
		&:hover {
			background-color: @mainColor_light_light;
		}
	}

	.cover {
		width: 50px;
		height: 50px;
		object-fit: cover;
		margin-left: 20px;
	}

	.title {
		font-weight: bold;
		font-size: 20px;
		color: #ffffff;
		margin-left: 20px;
		text-align: left;
		flex-grow: 1;

		.total {
			display: inline-block;
			font-weight: normal;
			font-size: 16px;
			// margin: 0 10px;
			width: auto;
			padding: 5px;
			border-radius: 10px;
			background-color: rgba(0, 0, 0, .15);
		}

		.owner {
			font-weight: normal;
			font-size: 16px;
			text-transform: capitalize;
			opacity: .75;
		}

	}

	.checkbox {
		border-radius: 7px;
		background-color: #fff;
		flex-grow: 0;
		min-width: 25px;
		min-height: 25px;
	}

	.deleteBt {
		width: 30px;
		height: 30px;
	}
}

@media only screen and (max-width: 500px) {
	.playlistentry{
		padding-left: 15px;
		.cover {
			margin-left: 10px;
		}

		.title {
			margin-left: 20px;
		}
	}
}
</style>