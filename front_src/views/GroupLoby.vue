<template>
	<div class="grouploby">
		<div v-if="loading" class="loader">
			<img src="@/assets/loader/loader.svg" alt="loader">
		</div>

		<div v-if="!loading">
			<div class="playlists header">
				<h1>Selected Playlists</h1>
				<div v-for="p in sortedPlaylists" :key="p.id" class="playlist">
					<img :src="p.cover" :alt="p.name" class="cover">
					<span class="label">{{p.name}}</span>
				</div>
			</div>

			<div class="users" v-if="room.users.length > 0">
				<h2>Connected users</h2>
				<ul>
					<li v-for="u in room.users" :key="u.id" class="user" :class="userClasses(u)">{{u.name}}</li>
				</ul>
			</div>

			<form @submit.prevent="onSubmit()" class="form" v-if="!me">
				<div class="line">
					<label for="username">Enter your name :</label>
					<input type="text" id="username" class="dark" v-model="userName" maxlength="50">
				</div>
				<div class="line">
					<Button title="Join game" type="submit" :disabled="userName.length < 3" :loading="joining" />
				</div>
			</form>

			<Button title="Start game"
				class="start"
				type="button"
				:icon="require('@/assets/icons/play.svg')"
				big
				:disabled="room.users.length < 2"
				v-if="canStartGame"
				@click="startGame()" />

			<div v-if="!canStartGame && room.users.length > 0" class="waitHost">
				<img src="@/assets/loader/loader_white.svg" alt="loader" class="spinner">
				<span>Wait for your host, <strong>{{creatorName}}</strong>, to start the game</span>
			</div>

			<div v-if="room" class="shareUrl" ref="share">
				<span class="title">Invite friends :</span>
				<div class="inputs">
					<input type="text" v-model="shareUrl" class="dark" @focus="$event.target.select()">
					<Button :icon="require('@/assets/icons/copy.svg')" data-tooltip="Copy" class="copy" @click="shareCurrentRoom()" />
				</div>
				<p class="copied" v-if="showCopied">Link copied to clipboard</p>
			</div>
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
import gsap from 'gsap';

@Component({
	components:{
		Button,
	}
})
export default class GroupLoby extends Vue {

	@Prop()
	public id:string;

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

	public get canStartGame():boolean {
		if(!this.me) return false;
		return this.room.creator == this.me.id;
	}

	public get me():UserData {
		return this.$store.state.userGroupData;
	}

	public get shareUrl():string {
		return window.location.href;
	}

	public get creatorName():string {
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

	public async loadDetails():Promise<void> {
		try {
			let res = await Api.get("group/details", {roomId:this.id});
			this.room = res.room;
		}catch(error) {
			this.$store.dispatch("alert", error.message);
			if(this.$store.state.loggedin) {
				this.$router.push({name:"playlists"});
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

	public onJoin(e:SocketEvent):void {
		let found = false;
		for (let i = 0; i < this.room.users.length; i++) {
			if(this.room.users[i].id == e.data.id) found = true;
		}
		if(!found) {
			this.room.users.push(e.data);
		}
	}
	
	public onLeave(e:SocketEvent):void {
		for (let i = 0; i < this.room.users.length; i++) {
			const u = this.room.users[i];
			if(u.id == e.data.id) {
				this.room.users.splice(i, 1);
			}
		}
	}

	public onStartGame(e:SocketEvent):void {
		this.$store.dispatch("setGroupRoomData", e.data);
		this.$router.push({name:"group/play"});
	}

	public startGame():void {
		SockController.instance.sendMessage({action:SOCK_ACTIONS.START_GROUP_GAME, includeSelf:true, data:this.room});
	}

	/**
	 * Copies the current link to share it with people
	 */
	public shareCurrentRoom():void {
		Utils.copyToClipboard(window.location.href);
		this.showCopied = true;
		setTimeout(() => {
			this.showCopied = false;
		}, 5000);
		this.$nextTick().then(_=> {
			gsap.set(this.$refs.share, {filter:"brightness(1)"});
			gsap.from(this.$refs.share, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
		})
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
			}
		}
	}

	.form {
		margin-top: 50px;
		display: flex;
		flex-direction: column;
		align-items: center;
		.line {
			display: flex;
			flex-direction: column;
			margin-bottom: 10px;
			input{
				max-width: 200px;
			}
		}
	}

	.start {
		display: flex;
		margin: auto;
		margin-top: 50px;
	}

	.users {
		width: 200px;
		margin: auto;
		
		h2 {
			font-weight: bold;
			font-size: 25px;
			border-bottom: 1px solid;
			padding-bottom: 5px;
			margin-bottom: 5px;
			text-align: center;
		}

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
				background-color: @mainColor_dark;
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

	.waitHost {
		margin-top: 50px;
		background-color: @mainColor_warn;
		border-radius: 50px;
		padding: 10px;
		font-style: italic;
		color: #fff;
		display: flex;
		flex-direction: row;
		align-items: center;
		span {
			text-align: center;
			flex-grow: 1;
		}
		.spinner {
			width: 20px;
			height: 20px;
		}
	}

	.shareUrl {
		margin:auto;
		margin-top: 50px;
		width:260px;
		padding: 10px;
		border-radius: 20px;
		color: @mainColor_dark;
		background-color: @mainColor_normal_light;

		.title {
			font-family:"Futura";
			text-align: center;
			font-size: 20px;
			margin-bottom: 5px;
			display: block;
		}
		.copied {
			background-color: @mainColor_highlight;
			color: #fff;
			border-radius: 50px;
			padding: 5px 10px;
			text-align: center;
			margin-top: 5px;
		}
		.inputs {
			display: flex;
			flex-direction: row;
			.copy {
				height: 38px;
				width: 38px;
				margin-left:2px;
			}
		}
	}
}
</style>