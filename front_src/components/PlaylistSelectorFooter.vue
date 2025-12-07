<template>
	<div class="playlistselectorfooter">
		<div class="playlists">
			<img src="@/assets/icons/playlist.svg" alt="check">
			<span>{{$t('playlists.footer.playlistCount', {count:playlists.length})}}</span>
		</div>

		<div class="tracks">
			<img src="@/assets/icons/song.svg" alt="check">
			<span>{{$t('playlists.footer.tracksCount', {count:totalTracks})}}</span>
		</div>

		<Slider v-if="mode == 'solo'" class="slider" :label="$t('playlists.footer.difficulty')" :min="1" :max="maxTracks" v-model="tracksCount" />
		
		<div class="min" v-if="totalTracks < 20">{{$t('playlists.footer.notEnough')}}</div>

		<div class="buttons">
			<Button :title="$t('playlists.footer.start')" big class="submit" @click="startBlindtest()" white v-if="totalTracks >= 20" />
		</div>
	</div>
</template>

<script lang="ts">
import Button from '@/components/Button.vue';
import Slider from '@/components/Slider.vue';
import PlaylistData from '@/vo/PlaylistData';
import { Component, Prop, Vue } from "vue-property-decorator";
import Config from '../utils/Config';

@Component({
	components:{
		Button,
		Slider,
	}
})
export default class PlaylistSelectorFooter extends Vue {

	@Prop({default:null})
	public playlists:PlaylistData[];
	@Prop()
	public mode:string;

	public tracksCount:number = 4;

	public get maxTracks():number { return Config.MAX_TRACK_COUNT; }

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

}
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