<template>
	<div class="home">
		<div class="holder">
			<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">

			<div class="head">
				<h1>{{$t('home.title')}}</h1>
				<p class="light">{{$t('home.subtitle')}}</p>
				<p class="subtitle" v-html="$t('home.head', {tracksCount:tracksCount})"></p>
			</div>

			<Button v-if="!loggedIn" :title="$t('home.connectSpotify')" :to="{name:'redirect', query:{uri:authUrl}}" :icon="require('@/assets/icons/spotify.svg')" class="button" big />
			<Button v-if="!loggedIn" :title="$t('home.demo')" :to="{name:'demo'}" :icon="require('@/assets/icons/play.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.solo')" :to="{name:'playlists', params:{mode:'solo'}}" :icon="require('@/assets/icons/solo.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.multi')" :to="{name:'playlists', params:{mode:'multi'}}" :icon="require('@/assets/icons/multiplayer.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.create')" :to="{name:'create'}" :icon="require('@/assets/icons/song.svg')" class="button" big />
		</div>
		<div class="footer">
			<router-link to="/changelog">{{$t('home.changelog')}}</router-link>
			<div v-html="$t('home.footer')"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from '@/components/Button.vue';
import SpotifyAPI from '@/utils/SpotifyAPI';
import Config from '@/utils/Config';

@Component({
	components:{
		Button,
	}
})
export default class Home extends Vue {

	@Prop()
	public from:string;

	public get loggedIn() {
		return this.$store.state.loggedin;
	}

	public get authUrl():string {
		if(this.from) {
			localStorage.setItem("redirect", this.from);
		}
		return SpotifyAPI.instance.getAuthUrl();
	}

	public get tracksCount():number {
		return Config.MAX_TRACK_COUNT;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.home{
	.holder {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		.center();
		transform: translate(-50%, -60%);
	
		.head {
			margin-bottom: 30px;
			&>* {
				margin-bottom: 10px;
			}
			.light {
				opacity: .5;
				font-style: italic;
				text-align: center;
				margin-top: -15px;
			}
			.subtitle {
				margin-top: 20px;
			}
		}
	
		.logo {
			max-height: 200px;
			margin-bottom: 30px;
		}
	
		.button {
			margin-bottom: 10px;
		}

		.or {
			margin: 10px 0;
		}
	}

	.footer {
		position: fixed;
		bottom: 5px;
		left: 0;
		text-align: center;
		width: 100%;
		font-style: italic;
	}
}

@media only screen and (max-width: 500px) {
	.home{
		.holder {
			width: 90vw;
			.head {
				.subtitle {
					font-size: 18px;
				}
			}
		}
	}
}
</style>