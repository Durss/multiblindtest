<template>
	<div class="twitchintro">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>MultiBlindTest on Twitch</h1>
		<div class="content">
			<div class="head">
				<p>You're a streamer and you want to play with your viewers?</p>
				<p>The MultiBlindTest Twitch Extension is for you.</p>
			</div>
			<div>Twitch won't allow the extension because of <strong>DMCA</strong> issues, if you want to be able to use it <strong>you must be manually added to the allowed users list</strong>.</div>
			<div>Send your twitch nickname with the form bellow to request access:</div>
			<form class="form"  @submit.prevent="submitTwitchName()" v-if="!success">
				<input type="text" class="dark" placeholder="twitch user name..." v-model="twitchName">
				<Button class="submit"
					type="submit"
					:loading="sendingTwitchName"
					:disabled="!twitchName || twitchName.length < 4"
					:icon="require('@/assets/icons/checkmark_white.svg')" />
			</form>
			<div class="error" v-if="error" @click="error=false">Something went wrong :(...</div>
			<div class="success" v-if="success">Thank you i'll get in touch with you on Twitch once done!</div>
			<div>You'll then need to create an access key so the app can receive the chat messages.</div>
			<div>Finally you'll be invited to link your Spotify account.</div>
		</div>
		<Button :icon="require('@/assets/icons/twitch.svg')" title="Proceed" :to="{name:'twitch/auth'}" />
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import Api from "@/utils/Api";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
	}
})
export default class TwitchIntro extends Vue {

	public twitchName:string = "";
	public error:boolean = false;
	public success:boolean = false;
	public sendingTwitchName:boolean = false;

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public async submitTwitchName():Promise<void> {
		if(this.twitchName.length < 4) return;
		this.sendingTwitchName = true;

		try {
			await Api.post("twitch/requestAccess", {user:this.twitchName});
		}catch(e) {
			this.sendingTwitchName = false;
			
			return;
		}
		this.sendingTwitchName = false;
		this.success = true;

	}

}
</script>

<style scoped lang="less">
.twitchintro{
	display: flex;
	flex-direction: column;
	align-items: center;

	.logo {
		height: 200px;
	}
	&>* {
		margin-bottom: 20px;
	}
	strong {
		color: @mainColor_warn;
	}

	.head {
		margin-bottom: 20px;
		text-align: center;
		font-size: 20px;
	}

	.error {
		color: #fff;
		background-color: @mainColor_alert;
		border-radius: 10px;
		margin: auto;
		margin-bottom: 20px;
		margin-top: -20px;
		padding: 5px;
		width: min-content;
		white-space: nowrap;
	}

	.success {
		font-weight: bold;
		margin-bottom: 20px;
		text-align: center;
		color: #fff;
		padding: 5px;
		border-radius: 10px;
		background-color: @mainColor_normal;
	}

	.form {
		display: flex;
		flex-direction: row;
		justify-content: center;
		margin-bottom: 20px;
		input {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}
		.submit {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
	}
}
</style>