<template>
	<div class="twitchintro">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>MultiBlindtest on Twitch</h1>
		<div class="content">
			<div>To play on twitch you'll need to create an access key so the app can receive the chat messages.</div>
			<div>You'll also be invited to link your Spotify account.</div>
		</div>
		<Button :icon="require('@/assets/icons/twitch.svg')" title="Proceed" :to="{name:'twitch/auth'}" />
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
	}
})
export default class TwitchIntro extends Vue {

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
}
</style>