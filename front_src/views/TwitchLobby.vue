<template>
	<div class="twitchlobby">

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
			:disabled="players.length < 2 || (expertMode != null && expertMode.length == 0)"
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

				<div class="users">
					<div v-for="u in players" :key="u.id" class="user">
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
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import GameParams from "@/components/GameParams.vue";
import IncrementForm from "@/components/IncrementForm.vue";
import IRCClient, {IRCTypes} from "@/twitch/IRCClient";
import IRCEvent from "@/twitch/IRCevent";
import PlaylistData from "@/vo/PlaylistData";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
		GameParams,
		IncrementForm,
	}
})
export default class TwitchLobby extends Vue {

	@Prop({default:""})
	public playlistids:string;

	@Prop({default:""})
	public trackscounts:string;


	public selectedPlaylists:PlaylistData[] = null;

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

	public mounted():void {
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
		console.log("Let's goooooowwww");
	}

}
</script>

<style scoped lang="less">
.twitchlobby{
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

		.users {
			.user {
				background-color: @mainColor_normal_light;
				border-radius: 15px;
				padding: 0 10px;
				color: @mainColor_dark;
				display: flex;
				flex-direction: row;
				width: 100%;
				margin-bottom: 2px;
				box-sizing: border-box;

				.text {
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 30px;
					width: 180px;
					flex-grow: 1;
				}
			
				&::before {
					content: " ";
					background-color: @mainColor_normal;
					border-radius: 50%;
					display: inline-block;
					width: 5px;
					height: 5px;
					margin-top: 12px;
					margin-right: 13px;
					margin-left: 7px;
					vertical-align: middle;
				}
			}
		}
	}
}
</style>