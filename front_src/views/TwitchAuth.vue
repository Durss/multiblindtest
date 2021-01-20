<template>
	<div class="twitchauth">
		<BouncingLoader
			v-if="loading"
			class="loader"
			:icon="require('@/assets/icons/twitch.svg')"
			label="Connecting to Twitch..." />
		
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
					<div v-if="errorIRC" class="error" @click="error=null">Unable to connect to twitch chat via IRC</div>
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
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import IRCClient from "@/twitch/IRCClient";
import TwitchUtils from "@/twitch/TwitchUtils";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
		BouncingLoader,
	}
})
export default class TwitchAuth extends Vue {

	public loading:boolean = false;
	public checkingToken:boolean = false;
	public showForm:boolean = false;
	public error:boolean = false;
	public errorIRC:boolean = false;
	public token:string = null;

	public async mounted():Promise<void> {
		let token = this.$store.state.twitchOAuthToken;
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
				this.errorIRC = true;
				this.loading = false;
				this.checkingToken = false;
				return;
			}
			console.log('res', res);
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

	.loader {
		.center();
		position: absolute;
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