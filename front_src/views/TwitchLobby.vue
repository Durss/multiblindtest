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
				:disabled="players.length == 0"
				@click="startGame()" />

			<div class="block players">
				<h2 class="highlight">{{$t('group.lobby.players')}}</h2>
				<div class="content">
					<div class="command">
						<div>Type the following command on your chat to join the game:</div>
						<input type="text" v-model="command" class="dark small">
						<div class="info">(customize the command as you wish)</div>
						<Button title="Send instructions to chat" :icon="require('@/assets/icons/twitch.svg')" @click="sendToChat()" :loading="sendingToChat" />
					</div>

					<div class="playersCount">
						<img src="@/assets/icons/user.svg" class="icon">
						<span>{{players.length}}/{{maxPlayers}}</span>
					</div>

					<div class="users">
						<div v-for="u in players" :key="u.id" class="user" :style="getUserClasses(u)">
							<span class="text">{{u['display-name']}}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="block params">
				<GameParams :gamesCount.sync="gamesCount" :tracksCount.sync="tracksCount" :expertMode.sync="expertMode">
					<IncrementForm class="increment" :title="$t('twitch.lobby.maxPlayers')" v-model="maxPlayers" maxValue="200" />
				</GameParams>
			</div>
		</div>
		
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import GameParams from "@/components/GameParams.vue";
import IncrementForm from "@/components/IncrementForm.vue";
import IRCClient, {IRCTypes} from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import Utils from "@/utils/Utils";
import PlaylistData from "@/vo/PlaylistData";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

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

	public selectedPlaylists:PlaylistData[] = null;

	public ready:boolean = false;
	public sendingToChat:boolean = false;
	public maxPlayers:number = 100;
	public gamesCount:number = 10;
	public tracksCount:number = 4;
	public expertMode:string[] = [];
	public command:string = "!mbt";
	public players:IRCTypes.Tag[] = [];

	public ircMessageHandler:any;

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
			let res
			try {
				res = await IRCClient.instance.initialize(this.$store.state.twitchLogin, this.$store.state.twitchOAuthToken);
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

		this.ircMessageHandler = (e:IRCEvent) => this.onIrcMessage(e);
		IRCClient.instance.addEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);
	}

	public beforeDestroy():void {
		IRCClient.instance.removeEventListener(IRCEvent.MESSAGE, this.ircMessageHandler);
	}

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

	public sendToChat():void {
		this.sendingToChat = true;
		setTimeout(() => {
			IRCClient.instance.sendMessage(this.inviteMessage);
		}, 250);
	}

	public startGame():void {
		this.$store.dispatch("setAllowedTwitchUsers", this.players);
		let params:any = {
			playlistids:this.playlistids,
			tracksCount:this.tracksCount.toString(),
			gamesCount:this.gamesCount.toString(),
		}
		if(this.expertMode && this.expertMode.length > 0) {
			params.expertMode = this.expertMode.join(",");
		}
		console.log(params);
		this.$router.push({name:"twitch/play", params})
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
			padding: 5px 20px;
			box-sizing: border-box;
			width: min-content;
			white-space: nowrap;
			max-width: 100%;
			margin-bottom: 5px;
			.label {
				color: #fff;
				margin-left: 20px;
				overflow: hidden;
				line-height: 30px;
				text-overflow: ellipsis;
			}
			.cover {
				width: 30px;
				height: 30px;
				border-radius: 10px;
				object-fit: cover;
			}
		}
	}

	.params {
		margin: auto;
		width: min-content;
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
		width: 300px;
		.command {
			margin-bottom: 10px;
			text-align: center;
			input {
				text-align: center;
			}
			.info {
				font-size: 14px;
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
			.user {
				background-color: @mainColor_normal_light;
				border-radius: 15px;
				padding: 0 10px;
				color: @mainColor_dark;
				width: 100%;
				margin-bottom: 2px;
				box-sizing: border-box;

				.text {
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 30px;
					width: 260px;
					box-sizing: border-box;
					display: inline-block;
					text-align: center;
				}
			}
		}
	}
}
</style>