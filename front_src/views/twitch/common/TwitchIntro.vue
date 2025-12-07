<template>
	<div class="twitchintro">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>MultiBlindTest on Twitch</h1>
		<div class="content">
			<div class="head">
				<p>You're a streamer and you want to play with your viewers?</p>
				<p>The MultiBlindTest Twitch mode is for you.</p>
			</div>
		</div>
		<Button :icon="$getIcon('twitch')" title="Proceed" :to="{name:'twitch/auth'}" />
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