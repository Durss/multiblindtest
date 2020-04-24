<template>
	<div class="noplaylist">
		<p class="title" v-html="$t('playlists.noPlaylist.head', {refresh:$t('playlists.refresh')})"></p>
		<p v-html="$t('playlists.noPlaylist.suggestion')"></p>
		<ul class="list">
			<li><a class="button" href="https://open.spotify.com/playlist/09BfWHr6tID8xqOpDy0W4t?si=J98RJ-s9QUWApYRmKFWtAg" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Mega Blindtest</a></li>
			<li><a class="button" href="https://open.spotify.com/playlist/1kTNITnvHTzXc6iPjr9KYy?si=Mt49vXMwRii8gXtTcWR52g" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Blindtest Disney</a></li>
			<li><a class="button" href="https://open.spotify.com/playlist/1WA7caAqdAWUG3X9nc1yaC?si=RexC42-VRHuSUZVreMCEfQ" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Blindtest : Movie</a></li>
			<li><a class="button" href="https://open.spotify.com/playlist/4lcGPW6HrBRdFropnYJQiE?si=gEhEq_CDS1KbrIphQuje5A" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Blindtest 90-2000</a></li>
			<li><a class="button" href="https://open.spotify.com/playlist/7IYEknPtHEOnmzAz3arfoG?si=gGPCv4SVQvO32jHW3WmUuA" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Blindtest/Karaoké to torture your neighbors</a></li>
			<li><a class="button" href="https://open.spotify.com/playlist/4qBM20gJ3G758ygaB3mFMc?si=sh8xZ8-aQMahAmcocC3UIw" target="_blank"><img src="@/assets/icons/playlist.svg" class="icon">Blindtest : Movies, series, cartoons and video games</a></li>
		</ul>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from './Button.vue';

@Component({
	components:{
		Button
	}
})
export default class NoPlaylist extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.noplaylist{
	background-color: @mainColor_warn;
	padding: 20px;
	color: #fff;
	border-radius: 20px;

	p {
		margin-bottom: 20px;
	}

	.title {
		::v-deep strong {
			// color: @mainColor_warn;
			background-color: rgba(255,255,255,.3);
			padding: 2px 5px;
			line-height: 30px;
			border-radius: 10px;
		}
	}

	.list {
		margin-top: 20px;
		li {
			margin: 5px;
			a {
				display: block;
				.icon {
					height: 20px;
					margin-right: 10px;
					vertical-align: middle;
				}
			}
		}
	}
}
</style>