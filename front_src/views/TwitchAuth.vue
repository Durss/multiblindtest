<template>
	<div class="twitchauth">
		<BouncingLoader
			v-if="loading"
			class="loader"
			:icon="require('@/assets/icons/twitch.svg')"
			label="Connecting to Twitch..." />
		
		<div v-if="!loading">
			<h1>Connect with twitch</h1>
			<div class="step" v-if="!loggedIn">
				<div class="head">Please first generate an access token:</div>
				<Button to="https://twitchapps.com/tmi/"
					type="link"
					target="_blank"
					title="Generate token"
					:icon="require('@/assets/icons/ext_link.svg')"
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

			<div class="step" v-if="loggedIn">
				<div class="head">Configure this URL on OBS:</div>
				<div class="url" ref="url">
					<div class="text" @click="selectText">{{url}}</div>
					<Button :title="$t('global.copy')" :icon="require('@/assets/icons/copy.svg')" highlight @click="copyURL()" />
				</div>

				<div class="head">Or continue if you already are on OBS:</div>
				<Button :to="redirect" :title="$t('twitch.auth.continue')" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import IRCClient from "@/twitch/IRCClient";
import TwitchUtils from "@/twitch/TwitchUtils";
import Utils from "@/utils/Utils";
import gsap from "gsap";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
		BouncingLoader,
	}
})
export default class TwitchAuth extends Vue {

	@Prop({default:null})
	public oauthtoken:string;

	public loading:boolean = false;
	public checkingToken:boolean = false;
	public showForm:boolean = false;
	public error:boolean = false;
	public errorIRC:boolean = false;
	public loggedIn:boolean = false;
	public token:string = null;
	public url:string = null;
	public redirect:any = {name:'playlists', params:{mode:'twitch'}};

	public async mounted():Promise<void> {
		let token = this.$store.state.twitchOAuthToken;
		if(this.oauthtoken) {
			token =this.oauthtoken;
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
			console.log("Connected to IRC !", res);
			this.loggedIn = true;
			this.loading = false;
			if(this.oauthtoken) {
				this.$router.push(this.redirect);
			}else{
				this.url = document.location.origin+this.$router.resolve({name:'twitch/auth', params:{oauthtoken:this.token}}).href;
			}
			return true;
		}
		this.checkingToken = false;
		return false;
	}

	private clickGenerate():void {
		this.showForm = true;
	}

	private selectText(e:Event):void {
		let div = <HTMLDivElement>e.target;
		var selection = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(div);
		selection.removeAllRanges();
		selection.addRange(range);

	}

	private copyURL():void {
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

		.head {
			font-size: 20px;
			margin-bottom: 5px;
			&:not(:first-of-type) {
				margin-top: 20px;
			}
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
</style>