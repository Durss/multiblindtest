<template>
	<div class="twitchauth">
		<div class="loadMessage" v-if="loading">
			<img src="@/assets/loader/loader.svg" class="loader">
			<img src="@/assets/icons/twitch.svg" class="twitch" ref="twitchIcon">
			<div class="title">Connecting to Twitch...</div>
		</div>
		
		<div v-if="!loading">
			<h1>Connect with twitch</h1>
			<div class="step">
				<div class="head">Please first generate an access token:</div>
				<Button to="https://twitchapps.com/tmi/"
					type="link"
					target="_blank"
					title="Generate token"
					:icon="require('@/assets/icons/ext_link.svg')"
					@click.native="clickGenerate()" />
			</div>

			<div class="step" v-if="showForm">
				<div class="head">Paste the generated token bellow:</div>
				<form @submit.prevent="submitToken()">
					<input type="text" v-model="token" class="dark">
					<div v-if="error" class="error" @click="error=null">Invalid token</div>
					<Button class="submit"
						type="submit"
						title="Submit"
						:loading="checkingToken"
						:disabled="!token || token.length < 30"
						:icon="require('@/assets/icons/checkmark_white.svg')" />
				</form>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import IRCClient from "@/twitch/IRCClient";
import TwitchUtils from "@/twitch/TwitchUtils";
import gsap from "gsap";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
	}
})
export default class TwitchAuth extends Vue {

	public loading:boolean = false;
	public checkingToken:boolean = false;
	public showForm:boolean = false;
	public error:boolean = false;
	public token:string = null;

	public async mounted():Promise<void> {
		let token = this.$store.state.twitchOAuthToken;
		if(token) {
			gsap.from(this.$refs.twitchIcon, {duration: 1, ease:"Elastic.easeOut", scale:1.2, repeat:100}).yoyo(true);
			this.loading = true;
			this.token = token;
			let success = await this.submitToken();
			if(!success) {
				gsap.killTweensOf(this.$refs.twitchIcon);
				this.loading = false;
				this.error = null;
			}
		}
	}

	public beforeDestroy():void {
		
	}

	public async submitToken():Promise<boolean> {
		this.checkingToken = true;
		this.token = this.token.replace("oauth:", "");
		let json = await TwitchUtils.validateToken(this.token);
		if(!json) {
			this.error = true;
		}else{
			this.$store.dispatch("setTwitchOAuthToken", this.token);
			this.$store.dispatch("setTwitchLogin", json.login);
			await IRCClient.instance.initialize(json.login, this.token);
			this.loading = true;
			this.$router.push({name:'playlists', params:{mode:'twitch'}});
			return true;
		}
		this.checkingToken = false;
		return false;
	}

	private clickGenerate():void {
		this.showForm = true;
	}

}
</script>

<style scoped lang="less">
.twitchauth{
	text-align: center;

	.loadMessage {
		.center();
		position: absolute;

		.title {
			font-size: 20px;
		}

		.loader {
			width: 100px;
			height: 100px;
		}

		.twitch {
			position: absolute;
			width: 40px;
			top: 30px;
			left: 50%;
			transform: translate(-50%, 0);
		}
	}

	.step {
		margin-top: 20px;

		.head {
			font-size: 20px;
			margin-bottom: 5px;
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
	}

}
</style>