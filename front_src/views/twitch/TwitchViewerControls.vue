<template>
	<div class="twitchviewercontrols">
		<transition name="slide">
			<Button ref="openBt" v-if="!opened" :icon="require('@/assets/icons/gear.svg')" class="openBt" @click.prevent.stop="opened = true" />
		</transition>
		<transition name="slide">
			<div v-if="opened" class="content" @click.stop="/*ignore*/">
				<Button white :loading="loading" title="Start" v-if="section=='playlists'" @click="startGame()" />
				<Button white :loading="loading" title="End this round" v-if="section=='game' && !roundComplete" @click="endRound()" />
				<Button white :loading="loading" title="Next round" v-if="section=='game' && roundComplete && !gameComplete" @click="nextRound()" />
				<Button white :loading="loading" title="Show results" v-if="section=='game' && gameComplete" @click="showResults()" />
				<Button white :loading="loading" title="Replay" v-if="section=='leaderboard'" @click="replay()" />
			</div>
		</transition>
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		Button
	}
})
export default class TwitchViewerControls extends Vue {

	@Prop({default:""})
	public section:string;

	public loading:boolean = false;
	public opened:boolean = false;
	public roundComplete:boolean = false;
	public gameComplete:boolean = false;
	public clickHandler:any;

	public async mounted():Promise<void> {
		this.clickHandler = (e:MouseEvent) => this.onClickOutside(e);
		document.body.addEventListener("click", this.clickHandler);
		// IRCClient.instance.sendMessage("test")

		await TwitchExtensionHelper.instance.onConnect();

		SockController.instance.connect();
		SockController.instance.user = {
											name:"stream",//TwitchExtensionHelper.instance.auth.token,
											id:TwitchExtensionHelper.instance.auth.channelId+"_ext",
											offline:false,
											score:0,
											handicap:0,
										};
		this.onGameStateChange();
	}

	public beforeDestroy():void {
		SockController.instance.disconnect();
		document.body.removeEventListener("click", this.clickHandler);
	}

	public startGame():void {
		this.sendMessage("!start");
	}

	public endRound():void {
		this.sendMessage("!skip");
	}
	
	public nextRound():void {
		this.sendMessage("!next");
	}

	public showResults():void {
		this.sendMessage("!results");
	}

	public replay():void {
		this.sendMessage("!replay");
	}

	private async sendMessage(message:string):Promise<void> {
		let data = {
			target:TwitchExtensionHelper.instance.auth.channelId+"_ctrl",
			data:{action:SOCK_ACTIONS.SEND_TO_UID, data:message}
		};
		SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data});
		this.loading = true;
		setTimeout(_=> {
			this.loading = false;
		}, 1000)
		// let params = {
		// 	token:TwitchExtensionHelper.instance.auth.token,
		// 	channel:TwitchExtensionHelper.instance.auth.channelId,
		// 	clientId:TwitchExtensionHelper.instance.auth.clientId,
		// 	message
		// }
		// try {
		// 	await Api.post("twitch/sendToChat", params);
		// }catch(e){}
		// this.loading = false;
	}

	public onClickOutside(e:MouseEvent):void {
		this.opened = false;
	}

	@Watch("$store.state.twitchGameState", { immediate: true, deep: true })
	public onGameStateChange():void {
		let gameState = this.$store.state.twitchGameState;
		this.roundComplete = gameState.roundComplete
		this.gameComplete = gameState.gameComplete

	}
}
</script>

<style scoped lang="less">
.twitchviewercontrols{
	.openBt {
		position: absolute;
		width: 35px;
		height: 35px;
		padding: 5px;
		bottom: 0;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.content {
		background-color: @mainColor_normal;
		bottom: 0;
		position: absolute;
		padding: 10px;
		border-top-right-radius: 50px;
		border-bottom-right-radius: 50px;
	}

	.slide-enter-active, .slide-leave-active {
		transition: all .5s;
		transform: translate(0, 0);
	}
	.slide-enter, .slide-leave-to {
		transform: translate(-100%, 0);
	}
}
</style>