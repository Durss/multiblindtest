<template>
	<div class="playlistselectorfooter">
		<div class="playlists">
			<img src="@/assets/icons/playlist.svg" alt="check">
			<span>{{playlists.length}} playlist(s)</span>
		</div>

		<div class="tracks">
			<img src="@/assets/icons/song.svg" alt="check">
			<span>{{totalTracks}} tracks</span>
		</div>
		
		<div class="min" v-if="totalTracks < 20">Select at least 20 tracks</div>

		<Button title="Start" class="submit" @click="startBlindtest()" white v-if="totalTracks >= 20" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import PlaylistData from '../vo/PlaylistData';
import Button from '../components/Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class PlaylistSelectorFooter extends Vue {

	@Prop({default:[]})
	public playlists:PlaylistData[];

	public get totalTracks():number {
		let res = 0;
		for (let i = 0; i < this.playlists.length; i++) {
			const p = this.playlists[i];
			res += p.tracks.length;
		}
		return res;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public startBlindtest():void {
		this.$emit("start");
	}

	public overSubmit():void {
		console.log("ok")
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
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

	.min {
		font-family: "Futura";
		color: red;
		opacity: .5;
		margin: 17px;
	}

	.submit {
		margin-top: 5px;
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