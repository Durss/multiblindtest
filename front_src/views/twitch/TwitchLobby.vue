<template>
	<div class="twitchlobby">
		<BouncingLoader
			v-if="!ready"
			class="loader"
			:icon="require('@/assets/icons/twitch.svg')"
			label="Connecting to Twitch..." />
		
		<div v-if="ready">
			<div class="playlists header">
				<h1>{{$t('group.lobby.title')}}</h1>
				<div v-for="p in selectedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<Button :title="$t('group.lobby.start')"
				class="start"
				type="button"
				:icon="require('@/assets/icons/play.svg')"
				big
				@click="startGame()" />

			<!-- <div class="block players">
				<h2 class="highlight">{{$t('group.lobby.players')}}</h2>
				<div class="content">
					<div class="command">
						<div>Type the following command on your chat to join the game:</div>
						<input type="text" v-model="command" class="dark small">
						<div class="info">(customize the command as you wish)</div>
						<Button class="sendToChat" title="Send instructions to chat" :icon="require('@/assets/icons/twitch.svg')" @click="sendToChat()" :loading="sendingToChat" />
					</div>

					<div class="playersCount">
						<img src="@/assets/icons/user.svg" class="icon">
						<span>{{players.length}}/{{maxPlayers}}</span>
					</div>

					<div class="users">
						<div v-for="u in players" :key="u.id" class="user" :style="getUserClasses(u)">
							<span class="text">{{u.username}}</span>
						</div>
					</div>
				</div>
			</div> -->

			<div class="block params">
				<GameParams
				:gamesCount.sync="gamesCount"
				:gameDuration.sync="gameDuration"
				:acceptAlbum.sync="acceptAlbum"
				:tracksCount.sync="tracksCount"
				:expertMode.sync="expertMode">
					<IncrementForm class="increment" :title="$t('twitch.lobby.zoomLevel')" v-model="zoomLevel" :minValue=".5" :maxValue="3" :step=".1" />
					<Button type="checkbox" v-model="chatConfirm" :title="$t('twitch.lobby.chatConfirm')" :data-tooltip="$t('twitch.lobby.chatConfirmTT')" />
					<!-- <IncrementForm class="increment" :title="$t('twitch.lobby.maxPlayers')" v-model="maxPlayers" maxValue="200" :tenStep="true" /> -->
				</GameParams>
			</div>
			
			<div class="obsConfig">
				<h2>OBS config</h2>
				<div class="content">
					<div>Configure this URL in the OBS browser params:</div>
					<div class="url" ref="url">
						<div class="text" @click="selectText">{{urlOBS}}</div>
						<Button :title="$t('global.copy')" :icon="require('@/assets/icons/copy.svg')" highlight @click="copyURL()" />
					</div>
				</div>
			</div>
		</div>
		
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import GameParams from "@/components/GameParams.vue";
import IncrementForm from "@/components/IncrementForm.vue";
import SockController, { SOCK_ACTIONS } from "@/sock/SockController";
import IRCClient, { IRCTypes } from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import TwitchMessageType from "@/twitch/TwitchMessageType";
import Api from "@/utils/Api";
import Utils from "@/utils/Utils";
import PlaylistData from "@/vo/PlaylistData";
import SocketEvent from "@/vo/SocketEvent";
import gsap from "gsap/all";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
	components:{
		Button,
		GameParams,
		IncrementForm,
		BouncingLoader,
	}
})
export default class TwitchLobby extends Vue {

	@Prop({default:""})
	public playlistids:string;

	@Prop({default:""})
	public mode:string;

	public urlOBS:string = null;
	public selectedPlaylists:PlaylistData[] = null;

	public ready:boolean = false;
	public disposed:boolean = false;
	public sendingToChat:boolean = false;
	public maxPlayers:number = 100;
	public gamesCount:number = 10;
	public tracksCount:number = 4;
	public gameDuration:number = 60;
	public acceptAlbum:boolean = false;
	public chatConfirm:boolean = true;
	public zoomLevel:number = 1.7;
	public expertMode:string[] = [];
	public command:string = "!mbt";
	public players:IRCTypes.Tag[] = [];
	public ircMessageHandler:any;
	public socketMessageHandler:any;

	public get inviteMessage():string {
		return "SingsNote Join the game with the following command \""+this.command+"\"";
	}

	public getUserClasses(u:IRCTypes.Tag):any {
		let res:any = {};
		if(u.color) res["background-color"] = u.color;
		//If background is dark enough, make the label bright so it stays readable
		let lum = Utils.getLuminance(u.color);
		if(lum < .72) res["color"] = "#ffffff";
		return res;
	}

	public async mounted():Promise<void> {
		this.ready = IRCClient.instance.connected;
		if(!this.ready) {
			try {
				let res = await IRCClient.instance.initialize(this.$store.state.twitchLogin, this.$store.state.twitchOAuthToken);
			}catch(error) {
				this.$router.push({name:"twitch/auth"});
				return;
			}
			this.ready = true;
		}
		
		if(!this.playlistids) {
			this.$router.push({name:"twitch/auth"});
			return;
		}
		
		let route = {name:'twitchobs/viewer', params:{twitchLogin:this.$store.state.twitchLogin}};
		this.urlOBS = document.location.origin+this.$router.resolve(route).href;

		let playlists:PlaylistData[] = this.$store.state.playlistsCache;
		this.selectedPlaylists = [];
		
		for (let i = 0; i < playlists.length; i++) {
			if(this.playlistids.indexOf(playlists[i].id) > -1) {
				this.selectedPlaylists.push(playlists[i]);
			}
		}
		
		this.selectedPlaylists.sort((a, b) => {
			if(a.name > b.name) return 1;
			if(a.name < b.name) return -1;
			return 0;
		});

		this.broadcastInfosToExtension();

		this.ircMessageHandler = (e:IRCEvent) => this.onIrcMessage(e);
		IRCClient.instance.addEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);

		let res = await Api.post("twitch/user", {token:IRCClient.instance.token});
		SockController.instance.connect();
		SockController.instance.keepBroadcastingLastMessage = true;
		SockController.instance.user = {
											name:"controler",
											id:res.user.user_id+"_ctrl",
											offline:false,
											score:0,
											handicap:0,
										};
		this.socketMessageHandler = (e:SocketEvent) => this.onSocketMessage(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.SEND_TO_UID, this.socketMessageHandler);
	}

	public beforeDestroy():void {
		this.disposed = true;
		IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.SEND_TO_UID, this.socketMessageHandler);
	}

	/**
	 * Called when receiving a message from IRC
	 */
	public onIrcMessage(e:IRCEvent):void {
		if(e.tags["message-type"] == "action" && e.message == this.inviteMessage) {
			this.sendingToChat = false;
		}

		//User joins
		if(e.message.toLowerCase() == this.command.toLowerCase()) {
			if(this.players.length == this.maxPlayers) return;//Max players count reached

			for (let i = 0; i < this.players.length; i++) {
				const p = this.players[i];
				if(p["user-id"] == e.tags["user-id"]) return;//Uer already registered
			}
			this.players.push(e.tags);
		}
	}

	/**
	 * Called when receiving a message via socket
	 * This is used when the broadcaster uses the embeded controls
	 * on his/her stream extension
	 */
	public onSocketMessage(e:SocketEvent):void {
		if(e.data == "!start") {
			this.startGame();
		}
	}

	/**
	 * Sends a message to IRC
	 */
	public sendToChat():void {
		this.sendingToChat = true;
		setTimeout(() => {
			IRCClient.instance.sendMessage(this.inviteMessage);
		}, 250);
	}

	/**
	 * Starts the game
	 */
	public startGame():void {
		// this.$store.dispatch("setTwitchAllowedUsers", this.players);
		let params:any = {
			playlistids:this.playlistids,
			tracksCount:this.tracksCount.toString(),
			gamesCount:this.gamesCount.toString(),
			gameDuration:this.gameDuration.toString(),
			acceptAlbum:this.acceptAlbum? 1 : 0,
			chatConfirm:this.chatConfirm? 1 : 0,
			mode:this.mode,
			zoom:this.zoomLevel
		}
		if(this.expertMode && this.expertMode.length > 0) {
			params.expertMode = this.expertMode.join(",");
		}
		
		this.$router.push({name:"twitch/controls", params});
	}

	@Watch("expertMode")
	public onExpertModeChange():void {
		this.broadcastInfosToExtension();
	}

	@Watch("zoomLevel")
	public onZoomChange():void {
		this.broadcastInfosToExtension();
	}

	/**
	 * Broadcast current config infos to clients
	 */
	private broadcastInfosToExtension():void {
		let playlists = [];
		for (let i = 0; i < this.selectedPlaylists.length; i++) {
			const p = this.selectedPlaylists[i];
			playlists.push({name:p.name, cover:p.cover, id:p.id})
		}
		let data = {
			playlists,
			expert:this.expertMode,
			zoom:this.zoomLevel,
		}
		if(this.mode == "twitchObs") {
			let event = {
				target:this.$store.state.twitchLogin+"_ext",
				data:{action:SOCK_ACTIONS.SEND_TO_UID, data:{actionType:TwitchMessageType.PLAYLISTS, state:data}}
			};
			SockController.instance.sendMessage({action:SOCK_ACTIONS.SEND_TO_UID, data:event});
		}else{
			TwitchExtensionHelper.instance.broadcast(TwitchMessageType.PLAYLISTS, data);
		}
	}
	
	public copyURL():void {
		Utils.copyToClipboard(this.urlOBS);
		gsap.set(this.$refs.url, {filter:"brightness(100%)"})
		gsap.from(this.$refs.url, {duration:.5, filter:"brightness(200%)"})
	}

	public selectText(e:Event):void {
		let div = <HTMLDivElement>e.target;
		var selection = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(div);
		selection.removeAllRanges();
		selection.addRange(range);

	}
}
</script>

<style scoped lang="less">
.twitchlobby{
	.loader {
		.center();
		position: absolute;
	}
	
	.playlists {
		display: flex;
		flex-direction: column;
		align-items: center;

		h1 {
			margin-bottom: 20px;
		}

		.playlist {
			background-color: @mainColor_normal;
			border-radius: 100px;
			display: flex;
			flex-direction: row;
			align-items: center;
			padding: 5px 10px 5px 5px;
			box-sizing: border-box;
			width: min-content;
			white-space: nowrap;
			max-width: 100%;
			margin-bottom: 5px;
			.label {
				color: #fff;
				margin-left: 5px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.cover {
				width: 30px;
				height: 30px;
				border-radius: 50%;
				object-fit: cover;
			}
		}
	}

	.obsConfig {
		max-width: 300px;
		margin: auto;
		box-sizing: border-box;
		.content {
			.blockContent();
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
					width: 200px;
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

	.params {
		margin: auto;
		width: min-content;
		.noBg {
			display: flex;
			flex-direction: row;
			align-items: center;
			margin-bottom: 5px;
			label {
				cursor: pointer;
				margin: 0;
				margin-left: 10px;
				white-space: nowrap;
			}
		}
	}

	.block {
		margin-bottom: 20px;
		.content {
			.blockContent();
		}
	}
	
	.start {
		display: flex;
		margin: auto;
		margin-top: 25px;
		margin-bottom: 25px;
	}

	.players {
		margin-left: auto;
		margin-right: auto;
		width: 350px;
		.command {
			margin-bottom: 10px;
			text-align: center;
			input {
				text-align: center;
			}
			.info {
				font-size: 14px;
			}
			.sendToChat {
				margin-top: 10px;
			}
		}

		.playersCount {
			text-align: center;
			font-style: italic;
			margin-bottom: 10px;
			.icon {
				height: 18px;
				margin-right: 5px;
				vertical-align: top;
			}
		}

		.users {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			.user {
				background-color: @mainColor_normal_light;
				border-radius: 15px;
				padding: 0 10px;
				color: @mainColor_dark;
				width: min-content;
				margin-bottom: 5px;
				margin-right: 5px;
				max-width: 50%;
				box-sizing: border-box;

				.text {
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 30px;
					width: 100%;
					box-sizing: border-box;
					display: inline-block;
					text-align: center;
				}
			}
		}
	}
}
</style>