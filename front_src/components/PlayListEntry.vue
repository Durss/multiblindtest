<template>
	<div :class="classes" @click="onClick($event)">
		<Button type="checkbox" :value="selected" class="checkbox" v-if="!data.processingTracks" />
		<img src="@/assets/loader/loader_white.svg" alt="loader" v-if="data.processingTracks">

		<img :src="data.cover" class="cover" v-if="data.cover">
		
		<div class="title">
			<!-- <div v-if="reduced !== false" class="total" >{{data.tracks.length}}</div> -->
			<div class="label">{{data.name}}</div>
			<div v-if="reduced === false" class="owner">{{$t('playlists.owner', {owner:data.owner})}}</div>
			<div v-if="reduced === false" class="total" :data-tooltip="$t('playlists.playableTracksInfos')">{{$t('playlists.playableTracks', {count:data.tracks.length})}}</div>
		</div>
		
		<Button :icon="require('@/assets/icons/cross.svg')" v-if="data.searchOrigin" @click="onClickDelete($event)" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from './Button.vue';
import SpotifyAPI from '@/utils/SpotifyAPI';
import PlaylistData from '@/vo/PlaylistData';
import Utils from '../utils/Utils';

@Component({
	components:{
		Button
	}
})
export default class PlayListEntry extends Vue {

	@Prop()
	public data:PlaylistData;

	@Prop({default:false})
	public reduced:boolean;

	public selected:boolean = false;

	public get classes():string[] {
		let res = ["playlistentry"];
		if(this.selected) res.push("selected");
		if(this.reduced !== false) res.push("disabled");
		if(this.data.searchOrigin) res.push("fromSearch");
		return res;
	}


	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public onClick(event):void {
		if(this.data.processingTracks) {
			this.selected = false;
		}else{
			this.selected = !this.selected
		}
		this.$emit('select');
	}

	public onClickDelete(event:MouseEvent|TouchEvent):void {
		event.stopPropagation();//Avoid selection event being fired
		Utils.confirm(this.$t("playlists.deleteConfirm").toString())
		.then(_=> {
			this.$emit('delete', this.data);
		}).catch(e=>{/*ignore*/})
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
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
		// border-radius: 50%;
		background-color: #fff;
		flex-grow: 0;
	}
}
</style>