<template>
	<div class="twitchauth">
		<BouncingLoader
			v-if="loading"
			class="loader"
			:icon="require('@/assets/icons/twitch.svg')"
			label="Connecting to Twitch..." />
		
		<div v-if="!loading">
			<h1 v-if="!needSpotifyAuth && !loggedIn">Connect with twitch</h1>
			<h1 v-if="!needSpotifyAuth && loggedIn">Embed to your stream</h1>

			<div class="step" v-if="!loggedIn">
				<div class="head">Please first generate an access token</div>
				<Button to="https://twitchapps.com/tmi/"
					type="link"
					target="_blank"
					title="Generate token"
					:icon="require('@/assets/icons/twitch.svg')"
					@click.native="clickGenerate()" />
			</div>

			<div class="step" v-if="showForm && !loggedIn">
				<div class="head">Paste the generated token bellow:</div>
				<form @submit.prevent="submitToken()">
					<input type="text" v-model="token" class="dark">
					<div v-if="error" class="error" @click="error=null">Invalid token</div>
					<div v-if="errorIRC" class="error" @click="error=null">Unable to connect to twitch chat via IRC</div>
					<Button class="submit"
						type="submit"
						title="Submit"
						:loading="checkingToken"
						:disabled="!token || token.length < 30"
						:icon="require('@/assets/icons/checkmark_white.svg')" />
				</form>
			</div>

			<div class="step" v-if="loggedIn && url">
				<ToggleBlock class="block" :enabled="false" :closed="true" :icon="require('@/assets/icons/obs.svg')" title="Play on OBS (soon)">
					<!-- <div>Configure this URL in the OBS browser params:</div>
					<div class="url">
						<div class="text" @click="selectText">{{url}}</div>
						<Button :title="$t('global.copy')" :icon="require('@/assets/icons/copy.svg')" highlight @click="copyURL()" />
					</div>
					<div class="head">Or continue if you already are on OBS:</div>
					<Button :to="redirect" :title="$t('twitch.auth.continue')" big />
					<Button :to="{name:'playlists', params:{mode:'twitchObs'}}" title="Start game session" :icon="require('@/assets/icons/play.svg')" /> -->
				</ToggleBlock>

				<ToggleBlock class="block" :enabled="false" :icon="require('@/assets/icons/twitch.svg')" title="Play with Twitch extension">
					<div class="twitchExt">
						<div>Install the <strong>Twitch Extension</strong> and start a game:</div>
						<Button :to="twitchExtUrl" type="link" title="Install Twitch extension" target="_blank" :icon="require('@/assets/icons/twitch.svg')" />
						<Button :to="{name:'playlists', params:{mode:'twitchExt'}}" title="Start a game" :icon="require('@/assets/icons/play.svg')" />
					</div>
				</ToggleBlock>

				<ToggleBlock class="block" :closed="true" :icon="require('@/assets/icons/dmca.svg')" title="What about DMCA strike?">
					<div class="dmca">
						<div>The music won't be played on your stream but from within the extension so it will be undetectable by any live DMCA detection and your VOD won't have any trace of the audio.</div>
						<!-- <div>
							<p>At the time of this writting, live DMCA does not exist on twitch and you can configure OBS to have a different audio source for your live and your VOD.</p>
							<p>This means you can play music live and the VOD won't contain the MultiBlindtest audio.</p>
						</div>
						<div>Learn how to configure this here:</div>
						<Button to="https://help.twitch.tv/s/article/soundtrack-audio-configuration?language=en_US" type="link" title="Configure OBS for DMCA" target="_blank" :icon="require('@/assets/icons/twitch.svg')" />
						<div>Also, the fact that many tracks are playing at the same time might help being undetected ¯\_(ツ)_/¯</div> -->
					</div>
				</ToggleBlock>
			</div>
			
			<div v-if="needSpotifyAuth" class="spotifyConnect">
				<h1>Connect with spotify</h1>
				<div v-if="spotifyExpired">The spotify token has expired, click the button bellow to generate a new one</div>
				<div v-if="!spotifyExpired">You now need to connect with spotify so the app can access your playlists and load songs</div>
				<Button :title="$t('twitch.auth.spotifyConnect')" :to="{name:'redirect', query:{uri:authUrl}}" :icon="require('@/assets/icons/spotify.svg')" class="button" big />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import ToggleBlock from "@/components/ToggleBlock.vue";
import Store from "@/store/Store";
import IRCClient from "@/twitch/IRCClient";
import TwitchUtils from "@/twitch/TwitchUtils";
import Config from "@/utils/Config";
import SpotifyAPI from "@/utils/SpotifyAPI";
import Utils from "@/utils/Utils";
import gsap from "gsap";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
		ToggleBlock,
		BouncingLoader,
	}
})
export default class TwitchAuth extends Vue {

	@Prop({default:null})
	public twitchOAToken:string;
	@Prop({default:null})
	public spotifyOAToken:string;

	public loading:boolean = false;
	public checkingToken:boolean = false;
	public showForm:boolean = false;
	public error:boolean = false;
	public errorIRC:boolean = false;
	public loggedIn:boolean = false;
	public needSpotifyAuth:boolean = false;
	public spotifyExpired:boolean = false;
	public token:string = null;
	public url:string = null;

	public get authUrl():string {
		Store.set("redirect", document.location.origin+this.$router.resolve({name:'twitch/auth'}).href);
		return SpotifyAPI.instance.getAuthUrl();
	}

	public get twitchExtUrl():string { return Config.TWITCH_EXT_URL; }

	public async mounted():Promise<void> {
		let token = this.$store.state.twitchOAuthToken;
		if(this.twitchOAToken) {
			token =this.twitchOAToken;
		}
		if(token) {
			this.loading = true;
			this.token = token;
			let success = await this.submitToken();
			if(!success) {
				this.loading = false;
				this.error = false;
				this.errorIRC = false;
			}
		}
	}

	public beforeDestroy():void {
		
	}

	public async submitToken():Promise<boolean> {
		this.error = false;
		this.errorIRC = false;
		this.checkingToken = true;
		this.token = this.token.replace("oauth:", "");
		let json = await TwitchUtils.validateToken(this.token);
		if(!json) {
			this.error = true;
		}else{
			this.loading = true;
			this.$store.dispatch("setTwitchOAuthToken", this.token);
			this.$store.dispatch("setTwitchLogin", json.login);
			let res;
			try {
				res = await IRCClient.instance.initialize(json.login, this.token);
			}catch(error) {
				console.log("FAILED !");
				this.errorIRC = true;
				this.loading = false;
				this.checkingToken = false;
				return;
			}
			// console.log("Connected to IRC !", res);
			this.loggedIn = true;
			this.loading = false;
			if(this.twitchOAToken) {
				//Test if spotify token is valid
				try {
					await SpotifyAPI.instance.call("v1/me", null, false);
				}catch(error) {
					this.spotifyExpired = true;
					this.needSpotifyAuth = true;
					return;
				}
				// this.$router.push(this.redirect);
			}else if(!SpotifyAPI.instance.hasAccessToken){
				this.spotifyExpired = false;
				this.needSpotifyAuth = true;
			}else{
				let route = {name:'twitch/auth', params:{twitchOAToken:this.token, spotifyOAToken:this.$store.state.accessToken}};
				this.url = document.location.origin+this.$router.resolve(route).href;
			}
			return true;
		}
		this.checkingToken = false;
		return false;
	}

	public clickGenerate():void {
		setTimeout(_=> {
			this.showForm = true;
		}, 1000)
	}

	public selectText(e:Event):void {
		let div = <HTMLDivElement>e.target;
		var selection = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(div);
		selection.removeAllRanges();
		selection.addRange(range);

	}

	public copyURL():void {
		Utils.copyToClipboard(this.url);
		gsap.set(this.$refs.url, {filter:"brightness(100%)"})
		gsap.from(this.$refs.url, {duration:.5, filter:"brightness(200%)"})
	}

}
</script>

<style scoped lang="less">
.twitchauth{
	text-align: center;

	.loader {
		.center();
		position: absolute;
	}

	.step {
		margin-top: 20px;

		&:not(:first-of-type) {
			margin-top: 40px;
		}

		.head {
			font-size: 20px;
			margin-bottom: 20px;
		}

		form {
			width: 300px;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin: auto;
			input {
				width: 100%;
				text-align: center;
			}

			.submit {
				width: min-content;
				margin-top: 5px;
			}

			.error {
				color: #fff;
				display: inline-block;
				background-color: @mainColor_warn;
				padding: 5px 10px;
				width: ~"calc(100% - 30px)";
				box-sizing: border-box;
				border-bottom-left-radius: 10px;
				border-bottom-right-radius: 10px;
			}
		}

		.block {
			margin-bottom: 20px;

			.twitchExt {
				display: flex;
				flex-direction: column;
				align-items: center;
				&>*:not(:last-child) {
					margin-bottom: 5px;
				}
			}

			.url {
				display: flex;
				flex-direction: row;
				justify-content: center;
				margin-top: 10px;
				.text {
					color: #ffffff;
					padding: 5px 10px;
					display: inline-block;
					border-radius: 20px;
					background-color: @mainColor_normal;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					width: 300px;
					&:hover {
						word-wrap: break-word;
						overflow: visible;
						white-space: normal;
					}
				}
				.button {
					padding: 5px 10px 5px 5px;
					/deep/ .icon {
						margin-left: 0px;
						margin-right: 0px;
					}
				}
			}
		}
	}

	.spotifyConnect {
		&>* {
			margin-bottom: 20px;
		}
	}

}
</style>