<template>
	<div class="home">
		<div class="holder">
			<img src="@/assets/icons/home_logo.svg" class="logo">

			<div class="head">
				<h1>{{$t('home.title')}}</h1>
				<p class="light">{{$t('home.subtitle')}}</p>
				<p class="subtitle" v-html="$t('home.head', {tracksCount:tracksCount})"></p>
			</div>

			<Button v-if="!loggedIn" :title="$t('home.connectSpotify')" :to="{name:'redirect', query:{uri:authUrl}}" :icon="require('@/assets/icons/spotify.svg')" class="button" big />
			<Button v-if="!loggedIn" :title="$t('home.demo')" :to="{name:'demo'}" :icon="require('@/assets/icons/play.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.solo')" :to="{name:'playlists', params:{mode:'solo'}}" :icon="require('@/assets/icons/solo.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.multi')" :to="{name:'playlists', params:{mode:'multi'}}" :icon="require('@/assets/icons/multiplayer.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.twitch')" :to="{name:'twitch/auth'}" :icon="require('@/assets/icons/twitch.svg')" class="button" big />
			<Button v-if="loggedIn" :title="$t('home.create')" :to="{name:'create'}" :icon="require('@/assets/icons/playlist.svg')" class="button" big />
		</div>
		<div class="footer">
			<router-link to="/changelog" class="changelog">{{$t('home.changelog')}}</router-link>
			<div v-html="$t('home.footer')"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from '@/components/Button.vue';
import SpotifyAPI from '@/utils/SpotifyAPI';
import Config from '@/utils/Config';
import Store from "@/store/Store";

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
			Store.set("redirect", this.from);
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
.home{
	display: flex;
	flex-direction: column;
	min-height: 100%;
	height: 100%;
	.holder {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	
		.head {
			margin-bottom: 30px;
			&>* {
				margin-bottom: 10px;
			}
			.light {
				opacity: .5;
				font-style: italic;
				text-align: center;
				margin-top: -10px;
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
		margin-top: 20px;
		text-align: center;
		width: 100%;
		font-style: italic;

		::v-deep a > {
			background-color: fade(@mainColor_highlight, 10%);
			padding: 0 5px;
			border-radius: 5px;
			line-height: 22px;
			transition: all .25s;
			&:hover {
				color: @mainColor_warn;
				background-color: fade(#fff, 10%);
			}
		}

		.changelog {
			background-color: @mainColor_warn;
			border-radius: 10px;
			padding: 3px 8px;
			color: #fff;
			display: inline-block;
			&:hover {
				color: @mainColor_warn;
				background-color: #fff;
			}
		}
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