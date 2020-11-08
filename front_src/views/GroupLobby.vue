<template>
	<div class="grouplobby">
		<SimpleLoader theme="mainColor_normal"
			v-if="loading"
			class="loader"
			big />

		<div v-if="!loading" class="holder">
			<div class="playlists header">
				<h1>{{$t('group.lobby.title')}}</h1>
				<div v-for="p in sortedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<div class="users">
				<h2 class="highlight">{{$t('group.lobby.players')}}</h2>
				<div class="content">
					<div class="list" v-if="room.users.length > 0">
						<GroupLobbyUser
							v-for="u in room.users"
							:key="u.id"
							:data="u"
							:me="me"
							:isHost="u.id == room.creator"
							@update="onUpdateUserHandicap"
							@updateName="onUpdateUserName"
						/>
					</div>

					<form @submit.prevent="onSubmit()" class="form" v-if="!me">
						<label for="username">{{$t('group.lobby.join')}}</label>
						<div class="row">
							<input type="text" id="username" class="dark" v-model="userName" maxlength="50" :placeholder="$t('group.lobby.usernamePlaceholder')" v-focus>
							<Button :icon="require('@/assets/icons/checkmark_white.svg')" class="submit" type="submit" :disabled="userName.length < 3" :loading="joining" />
						</div>
					</form>
				</div>
			</div>

			<div v-if="isHost" class="params">
				<h2>{{$t('group.lobby.params')}}</h2>
				<div class="content">
					<IncrementForm class="increment" :title="$t('group.lobby.gamesCount')" v-model="gamesCount" maxValue="99" />
					<IncrementForm class="increment" :title="$t('group.lobby.tracksCount')" v-model="tracksCount" maxValue="6" />
					<ExpertModeForm v-model="expertMode" />
				</div>
			</div>

			<Button :title="$t('group.lobby.start')"
				class="start"
				type="button"
				:icon="require('@/assets/icons/play.svg')"
				big
				:disabled="room.users.length < 2 || (expertMode != null && expertMode.length == 0)"
				v-if="isHost"
				@click="startGame()" />

			<SimpleLoader theme="mainColor_normal"
				v-if="!isHost && room.users.length > 0"
				class="waitHost"
				:label="$t('group.lobby.wait', {hostName:hostName})" />

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
import SimpleLoader from '../components/SimpleLoader.vue';
import GroupLobbyUser from '../components/GroupLobbyUser.vue';

@Component({
	components:{
		Button,
		SimpleLoader,
		IncrementForm,
		ExpertModeForm,
		GroupLobbyUser,
		ShareMultiplayerLink,
	}
})
export default class GroupLobby extends Vue {

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
	public handicapHandler:any;
	public updateUserNameHandler:any;

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
		this.handicapHandler = (e) => this.onHandicap(e);
		this.updateUserNameHandler = (e) => this.onUserName(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.JOIN_ROOM, this.joinHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.leaveHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.START_GROUP_GAME, this.startGameHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.UPDATE_HANDICAP, this.handicapHandler);
		SockController.instance.addEventListener(SOCK_ACTIONS.UPDATE_USERNAME, this.updateUserNameHandler);
		this.loadDetails();
	}

	public beforeDestroy():void {
		//Cleanup listeners
		SockController.instance.removeEventListener(SOCK_ACTIONS.JOIN_ROOM, this.joinHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.LEAVE_ROOM, this.leaveHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.START_GROUP_GAME, this.startGameHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.UPDATE_HANDICAP, this.handicapHandler);
		SockController.instance.removeEventListener(SOCK_ACTIONS.UPDATE_USERNAME, this.updateUserNameHandler);
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
		if(this.room) {
			SockController.instance.groupId = this.room.id;
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
		res.me.offline = false;
		this.$store.dispatch("setUserGroupData", res.me);
		this.joining = false;
		if(this.room.currentTracks) {
			this.onStartGame();
		}
		if(this.room) {
			SockController.instance.groupId = this.room.id;
		}
	}

	/**
	 * Called when someone joins the room
	 */
	public onJoin(e:SocketEvent):void {
		if(!this.room) return;
		let found = false;
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.users[i].id == e.data.user.id) {
				found = true;
				this.room.users[i].offline = false;
			}
		}
		if(!found) {
			this.room.users.push(e.data.user);
		}
	}
	
	/**
	 * Called when someone leaves the room
	 */
	public onLeave(e:SocketEvent):void {
		if(!this.room) return;
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.user.id) {
				this.room.users[i].offline = true;
			}
		}
	}

	/**
	 * Called when socket tells to start the game
	 */
	public onStartGame(e?:SocketEvent):void {
		let data = e? e.data : this.room;
		this.$store.dispatch("setGroupRoomData", data);//This is only used to transmit data to game view
		this.$router.push({name:"group/play"});
	}

	/**
	 * Called when a user's handicap is updated
	 */
	public onHandicap(e:SocketEvent):void {
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.user.id) {
				Vue.set(u, "handicap", e.data.handicap);
			}
		}
	}

	/**
	 * Called when a user's name is updated
	 */
	public onUserName(e:SocketEvent):void {
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.user.id) {
				Vue.set(u, "name", e.data.user.name);
			}
		}
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

	public onUpdateUserHandicap(user:UserData, handicap:number):void {
		user.handicap = handicap;
		SockController.instance.sendMessage({action:SOCK_ACTIONS.UPDATE_HANDICAP, data:{user:user, handicap:handicap, groupId:this.room.id}});
	}

	public onUpdateUserName(user:UserData):void {
		this.$store.dispatch("setUserName", user.name);
		SockController.instance.sendMessage({action:SOCK_ACTIONS.UPDATE_USERNAME, data:{user:user, groupId:this.room.id}});
	}

}
</script>

<style scoped lang="less">
.grouplobby{
	.loader {
		.center();
		position: absolute;
		transform: translate(-50%, -50%);
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

				.list {
					width: 100%;
					padding-bottom: 10px;
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