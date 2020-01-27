<template>
	<div class="home">
		<div class="holder">
			<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">

			<div class="head">
				<h1>Multi Blindtest</h1>
				<p class="light">- try not to vomit -</p>
				<p class="subtitle">It's like playing <strong>{{tracksCount}}</strong> blind tests simultaneously, awful.</p>
				<!-- <p>Connect with spotify, select some playlists to pick song from and try to guess all the songs between the 5 playing at the same time.<br />Everytime you find an answer, the song is paused to help you find the others.</p> -->
			</div>

			<Button v-if="!loggedIn" title="Connect with Spotify" :to="{name:'redirect', query:{uri:authUrl}}" :icon="require('@/assets/icons/spotify.svg')" class="connect" big />
			<p class="or" v-if="!loggedIn">- OR -</p>
			<Button v-if="!loggedIn" title="Demo" :to="{name:'example'}" :icon="require('@/assets/icons/play.svg')" class="connect" big />
			<Button v-if="loggedIn" title="Start" :to="{name:'playlists'}" :icon="require('@/assets/icons/play.svg')" class="connect" big />
		</div>
		<div class="footer">
			Coded by <a href="https://www.durss.ninja" target="_blank">Durss</a>. Get sources <a href="https://github.com/Durss/multiblindtest" target="_blank">on github</a><br />
			Based on <a href="https://www.youtube.com/watch?v=_dN0DpE0q3E" target="_blank">an idea</a> from <a href="https://twitter.com/navo_" target="_blank">Navo</a> & <a href="https://twitter.com/kyank" target="_blank">Kyan Khojandi</a>.
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
	
		.connect {
			margin: auto;
			font-size: 20px;
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