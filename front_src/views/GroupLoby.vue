<template>
	<div class="grouploby">
		<div v-if="loading" class="loader">
			<img src="@/assets/loader/loader.svg" alt="loader">
		</div>

		<div v-if="!loading" class="holder">
			<div class="playlists header">
				<h1>{{$t('group.loby.title')}}</h1>
				<div v-for="p in sortedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<div class="users">
				<h2 class="highlight">{{$t('group.loby.players')}}</h2>
				<div class="content">
					<ul v-if="room.users.length > 0">
						<li v-for="u in room.users" :key="u.id" class="user" :class="userClasses(u)">{{u.name}}</li>
					</ul>

					<form @submit.prevent="onSubmit()" class="form" v-if="!me">
						<label for="username">{{$t('group.loby.join')}}</label>
						<div class="row">
							<input type="text" id="username" class="dark" v-model="userName" maxlength="50" :placeholder="$t('group.loby.usernamePlaceholder')">
							<Button :icon="require('@/assets/icons/checkmark_white.svg')" class="submit" type="submit" :disabled="userName.length < 3" :loading="joining" />
						</div>
					</form>
				</div>
			</div>

			<div v-if="isHost" class="params">
				<h2>{{$t('group.loby.params')}}</h2>
				<div class="content">
					<IncrementForm class="increment" :title="$t('group.loby.gamesCount')" v-model="gamesCount" />
					<IncrementForm class="increment" :title="$t('group.loby.tracksCount')" v-model="tracksCount" maxValue="6" />
					<ExpertModeForm v-model="expertMode" />
				</div>
			</div>

			<Button :title="$t('group.loby.start')"
				class="start"
				type="button"
				:icon="require('@/assets/icons/play.svg')"
				big
				:disabled="room.users.length < 2 || (expertMode && expertMode.length == 0)"
				v-if="isHost"
				@click="startGame()" />

			<div v-if="!isHost && room.users.length > 0" class="waitHost">
				<img src="@/assets/loader/loader_white.svg" alt="loader" class="spinner">
				<span v-html="$t('group.loby.wait', {hostName:hostName})"></span>
			</div>

			<ShareMultiplayerLink v-if="room" class="shareUrl" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Api from '../utils/Api';
import Utils from '../utils/Utils';
import RoomData from '../vo/RoomData';
import Button from '../components/Button.vue';
import UserData from '../vo/UserData';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import SocketEvent from '../vo/SocketEvent';
import IncrementForm from '../components/IncrementForm.vue';
import ShareMultiplayerLink from '../components/ShareMultiplayerLink.vue';
import ExpertModeForm from '../components/ExpertModeForm.vue';

@Component({
	components:{
		Button,
		IncrementForm,
		ExpertModeForm,
		ShareMultiplayerLink,
	}
})
export default class GroupLoby extends Vue {

	@Prop()
	public id:string;

	public gamesCount:number = 5;
	public tracksCount:number = 4;
	public expertMode:string[] = null;
	public showCopied:boolean = false;
	public loading:boolean = true;
	public joining:boolean = false;
	public room:RoomData = null;
	public userName:string = "";
	public joinHandler:any;
	public leaveHandler:any;
	public startGameHandler:any;

	//Sort playlists by name size for a better looking list rendering
	public get sortedPlaylists():any[] {
		return this.room.playlists.sort((a, b) => {
			if(a.name > b.name) return 1;
			if(a.name < b.name) return -1;
			return 0;
		})
	}

	public get isHost():boolean {
		if(!this.me) return false;
		return this.room.creator == this.me.id;
	}

	public get me():UserData {
		return this.$store.state.userGroupData;
	}

	public get hostName():string {
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.creator == this.room.users[i].id) {
				return this.room.users[i].name;
			}
		}
		return null;
	}

	public mounted():void {
		this.joinHandler = (e) => this.onJoin(e);
		this.leaveHandler = (e) => this.onLeave(e);
		this.startGameHandler = (e) => this.onStartGame(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, this.joinHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.leaveHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.START_GROUP_GAME, this.startGameHandler);
		this.loadDetails();
	}

	public beforeDestroy():void {
		//Cleanup listeners
		SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, this.joinHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.leaveHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.START_GROUP_GAME, this.startGameHandler);
	}

	public userClasses(u:UserData):string[] {
		let res = [];
		if(this.me && u.id == this.me.id) res.push("me");
		if(u.id == this.room.creator) res.push("host")
		return res;
	}

	/**
	 * Load group's details
	 */
	public async loadDetails():Promise<void> {
		try {
			let res = await Api.get("group/details", {roomId:this.id});
			this.room = res.room;
		}catch(error) {
			this.$store.dispatch("alert", error.message);
			if(this.$store.state.loggedin) {
				this.$router.push({name:"playlists", params:{mode:"multi"}});
			}else{
				this.$router.push({name:"home"});
			}
			return;
		}
		this.loading = false;
		if(this.me) {
			this.onSubmit();//Auto join room
		}
	}

	/**
	 * Called when subitting form
	 */
	public async onSubmit():Promise<void> {
		this.joining = true;
		var res;
		let data:any = {
				username:this.userName,
				roomId:this.room.id
			};
		if(this.me) {
			delete data.username;
			data.user = this.me;
		}
		try {
			res = await Api.post("group/join", data);
			this.room = res.room;
		}catch(error) {
			this.joining = false;
			this.$store.dispatch("alert", error.message);
			return;
		}
		
		this.$store.dispatch("setUserGroupData", res.me);
		this.joining = false;
	}

	/**
	 * Called when someone joins the room
	 */
	public onJoin(e:SocketEvent):void {
		let found = false;
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.users[i].id == e.data.id) found = true;
		}
		if(!found) {
			this.room.users.push(e.data);
		}
	}
	
	/**
	 * Called when someone leaves the room
	 */
	public onLeave(e:SocketEvent):void {
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.id) {
				this.room.users.splice(i, 1);
			}
		}
	}

	/**
	 * Called when socket tells to start the game
	 */
	public onStartGame(e:SocketEvent):void {
		this.$store.dispatch("setGroupRoomData", e.data);
		this.$router.push({name:"group/play"});
	}

	/**
	 * Called when clicking "start" button.
	 * It sends a socket event to all users including self
	 * See onStartGame() method
	 */
	public startGame():void {
		this.room.tracksCount = this.tracksCount;
		this.room.gamesCount = this.gamesCount;
		this.room.expertMode = this.expertMode;
		Api.post("group/update", {room:this.room});
		SockController.instance.sendMessage({action:SOCK_ACTIONS.START_GROUP_GAME, includeSelf:true, data:this.room});
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.grouploby{
	.loader {
		.center();
		position: absolute;
		transform: translate(-50%, -50%) scale(2, 2);
	}

	.holder {
		&>div {
			box-sizing: border-box;
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
	
		.start {
			display: flex;
			margin: auto;
			margin-top: 25px;
		}
	
		.users {
			// width: 200px;
			width: min-content;
			margin: auto;
			min-width: 300px;
			.content {
				.blockContent();
				padding-bottom: 0px;
				ul {
					padding-bottom: 10px;
					.user {
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						line-height: 30px;
						background-color: @mainColor_normal_light;
						border-radius: 50px;
						padding: 0 10px;
						color: @mainColor_dark;
						margin-bottom: 2px;
			
						&.me {
							font-family: "Futura";
						}
						&::before {
							content: " ";
							background-color: @mainColor_normal;
							border-radius: 50%;
							display: inline-block;
							width: 5px;
							height: 5px;
							margin-right: 13px;
							margin-left: 7px;
							vertical-align: middle;
						}
						&.host {
							&::before {
								background-color: transparent;
								background-image: url("../assets/icons/king.svg");
								@ratio: 16 / 72;
								width: 100px * @ratio;
								height: 72px * @ratio;
								margin-right: 5px;
								margin-left: 0;
								border-radius: 0;
								vertical-align: baseline;
							}
						}
					}
				}
				
				.form {
					display: flex;
					flex-direction: column;
					padding-bottom: 10px;
					.row {
						display: flex;
						flex-direction: row;
						input {
							flex-grow: 1;
							border-top-right-radius: 0;
							border-bottom-right-radius: 0;
						}
						.submit {
							width: 39px;
							border-top-left-radius: 0;
							border-bottom-left-radius: 0;
						}
					}
				}
			}
		}
	
		.waitHost {
			margin-top: 25px;
			font-style: italic;
			color: #fff;
			display: flex;
			flex-direction: column;
			align-items: center;
			span {
				text-align: center;
				flex-grow: 1;
				background-color: @mainColor_warn;
				border-radius: 50px;
				padding: 10px;
			}
			.spinner {
				width: 20px;
				height: 20px;
				margin-bottom: -3px;
				// background-color: @mainColor_warn;
				padding: 10px 20px;
				background-image: url("../assets/loader/loader_bg.svg");
			}
		}
	
		.shareUrl {
			margin:auto;
			margin-top: 25px;
		}
	}

	.backHome {
		margin: auto;
		margin-top: 25px;
		width: min-content;
		display: block;
	}

	.params {
		margin: auto;
		margin-top: 25px;
		display: flex;
		flex-direction: column;
		width: min-content;
		.content {
			.blockContent();
			.increment:not(:last-child) {
				margin-bottom: 20px;
			}
		}
	}
}
</style>