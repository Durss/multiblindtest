<template>
	<div class="twitchauth">
		<BouncingLoader
			v-if="loading"
			class="loader"
			:icon="$getIcon('twitch')"
			label="Connecting to Twitch..." />
		
		<div v-if="!loading">
			<h1 v-if="!needSpotifyAuth && !loggedIn">Connect with Twitch</h1>
			<h1 v-if="!needSpotifyAuth && loggedIn">Embed to your stream</h1>

			<div class="step" v-if="!loggedIn">
				<div class="head">Please first generate an access token so I can read and write on your chat</div>
				<Button
					type="button"
					title="Generate token"
					:icon="$getIcon('twitch')"
					:loading="authenticating"
					@click.native="clickGenerate()" />
			</div>

			<div class="step" v-if="loggedIn && urlOBS">
				<ToggleBlock class="block" :enabled="false" :icon="$getIcon('obs')" title="Play on OBS">
					<div>Configure this URL in the OBS browser params:</div>
					<div class="url" ref="url">
						<div class="text" @click="selectText">{{urlOBS}}</div>
						<Button :title="$t('global.copy')" :icon="$getIcon('copy')" highlight @click="copyURL()" />
					</div>
					<!-- <div class="head">Or continue if you already are on OBS:</div> -->
					<!-- <Button :to="redirect" :title="$t('twitch.auth.continue')" big /> -->
					<Button :to="{name:'playlists', params:{mode:'twitchObs'}}" title="Start game session" :icon="$getIcon('play')" />
				</ToggleBlock>

				<ToggleBlock class="block" :closed="true" :icon="$getIcon('twitch')" title="Play with Twitch extension">
					<div class="twitchExt">
						<p>A twitch extension has been developped but Twitch won't validate it because of DMCA issues, sorry :(</p>
						<!-- <div>Install the <strong>Twitch Extension</strong> and start a game:</div>
						<Button :to="twitchExtUrl" type="link" title="Install Twitch extension" target="_blank" :icon="$getIcon('twitch')" />
						<router-link :to="{name:'twitch'}" class="getAccess">- get access -</router-link>
						<Button :to="{name:'playlists', params:{mode:'twitchExt'}}" title="Start a game" :icon="$getIcon('play')" /> -->
					</div>
				</ToggleBlock>

				<ToggleBlock class="block" :closed="true" :icon="$getIcon('dmca')" title="What about DMCA strike?">
					<div class="dmca">
						<!-- <div>The music won't be played on your stream but from within the extension so it will be undetectable by any live DMCA detection and your VOD won't have any trace of the audio.</div> -->
						<div>At the time of this writting, live DMCA does not exist on twitch and you can configure OBS to have a different audio source for your live and your VOD.</div>
						<div>This means you can play music live but VOD won't contain it.</div>
						<div>Learn how to configure this here:</div>
						<Button href="https://www.youtube.com/watch?v=7vd1EyQXq7A" type="link" title="Configure OBS to split audio sources" target="_blank" :icon="$getIcon('twitch')" />
						<div>Also, the fact that many tracks are playing at the same time might help remaining undetected by any futur live DMCA ¯\_(ツ)_/¯</div>
					</div>
				</ToggleBlock>
			</div>
			
			<div v-if="needSpotifyAuth" class="spotifyConnect">
				<h1>Connect with spotify</h1>
				<div v-if="spotifyExpired">The spotify token has expired, click the button bellow to generate a new one</div>
				<div v-if="!spotifyExpired">You now need to connect with spotify so the app can access your playlists and load songs</div>
				<Button :title="$t('twitch.auth.spotifyConnect')" :to="{name:'redirect', query:{uri:spotifyAuthUrl}}" :icon="$getIcon('spotify')" class="button" big />
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
import TwitchUtils, {TwitchAuthToken} from "@/twitch/TwitchUtils";
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
	public authenticating:boolean = false;
	public checkingToken:boolean = false;
	public error:boolean = false;
	public errorIRC:boolean = false;
	public loggedIn:boolean = false;
	public needSpotifyAuth:boolean = false;
	public spotifyExpired:boolean = false;
	public token:TwitchAuthToken|null = null;
	public urlOBS:string|null = null;
	public spotifyAuthUrl:string|null = null;

	public get twitchExtUrl():string { return Config.TWITCH_EXT_URL; }

	public async mounted():Promise<void> {
		this.loading = true;
		Store.set("redirect", document.location.origin+this.$router.resolve({name:'twitch/auth'}).href);
		this.spotifyAuthUrl = await SpotifyAPI.instance.getAuthUrl();
		this.loading = false;
		let token = this.$store.state.twitchOAuthToken;
		if(this.twitchOAToken) {
			token = this.twitchOAToken;
		}
		if(token) {
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
		let json = await TwitchUtils.validateToken(this.token.access_token);
		if(!json) {
			this.error = true;
		}else{
			let twitchLogin = json.login;
			this.loading = true;
			this.$store.dispatch("setTwitchOAuthToken", this.token);
			this.$store.dispatch("setTwitchLogin", twitchLogin);
			let res;
			try {
				res = await IRCClient.instance.initialize(twitchLogin, this.token.access_token);
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
				//Test if spotify token is valid, this condition is true for
				//OBS route as it contains all the necessary tokens
				try {
					await SpotifyAPI.instance.call("v1/me", null, false);
				}catch(error) {
					this.spotifyExpired = true;
					this.needSpotifyAuth = true;
					return;
				}
				let route = {
					name:"twitch/obs/play"
				}
				this.$router.push(route);
			}else if(!SpotifyAPI.instance.hasAccessToken){
				this.spotifyExpired = false;
				this.needSpotifyAuth = true;
			}else{
				// let route = {name:'twitch/auth', params:{twitchOAToken:this.token, spotifyOAToken:this.$store.state.accessToken}};
				// this.urlOBS = document.location.origin+this.$router.resolve(route).href;
				let route = {name:'twitchobs/viewer', params:{twitchLogin:twitchLogin}};
				this.urlOBS = document.location.origin+this.$router.resolve(route).href;
			}
			return true;
		}
		this.checkingToken = false;
		return false;
	}

	public async clickGenerate():Promise<void> {
		this.authenticating = true;
		this.token = await TwitchUtils.requestDCF();
		this.submitToken();
		this.authenticating = false;
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
		Utils.copyToClipboard(this.urlOBS);
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
			margin-bottom: 10px;
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
				.getAccess {
					font-size: 14px;
					font-style: italic;
					margin-top: -6px;
					margin-bottom: 10px;
					color: @mainColor_alert;
				}
			}

			.url {
				display: flex;
				flex-direction: row;
				justify-content: center;
				margin-top: 10px;
				margin-bottom: 10px;
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

			.dmca {
				div, .button {
					margin-bottom: 10px;
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