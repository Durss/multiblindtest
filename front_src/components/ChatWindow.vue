<template>
	<div class="chatwindow" v-if="messages.length > 0">
		<div class="list" ref="list" v-if="opened">
			<div v-for="m in messages" :key="m.id" :class="getClasses(m)">
				<div class="user">{{m.user.name}}</div>
				<div class="message">{{m.message}}</div>
			</div>
		</div>
		<Button :icon="require('@/assets/icons/'+(opened? 'cross_white' : 'chat')+'.svg')" class="close" @click="opened = !opened"/>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SocketEvent from '../vo/SocketEvent';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import Button from './Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class ChatWindow extends Vue {

	public messages:any[] = [];
	public opened:boolean = true;

	private messageHandler:any;

	public getClasses(m):string[] {
		let res = ["line"];
		if(m.user.id == this.$store.state.userGroupData.id) res.push("isme");
		return res;
	}

	public mounted():void {
		this.messageHandler = (e:SocketEvent) => this.onMessage(e);
		SockController.instance.addEventListener(SOCK_ACTIONS.CHAT_MESSAGE, this.messageHandler);
	}

	public beforeDestroy():void {
		SockController.instance.removeEventListener(SOCK_ACTIONS.CHAT_MESSAGE, this.messageHandler);
	}

	private  onMessage(e:SocketEvent):any {
		this.messages.push(e.data);
		if(this.messages.length > 20) this.messages.shift();
		this.scrollToBottom();
	}

	@Watch("opened")
	private onOpenToggle():void {
		this.scrollToBottom();
	}

	private async scrollToBottom():Promise<void> {
		await this.$nextTick();
		let list = <HTMLDivElement>this.$refs.list;
		if(!list) return;
		list.scrollTo(0, list.scrollHeight);
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.chatwindow{
	position: fixed;
	bottom: 0;
	right: 25px;
	max-width: 300px;
	.close {
		position: absolute;
		top: -20px;
		left: -20px;
	}

	.list {
		background-color: #fff;
		// background-color: @mainColor_normal_light;
		border: 1px solid @mainColor_normal_light;
		padding: 10px;
		border-radius: 20px;
		max-height: 290px;
		overflow-y: auto;
		.line {
			display: flex;
			flex-direction: row;
			align-items: center;
			&:not(:last-child) {
				margin-bottom: 8px;
			}

			&.isme {
				.user {
					background-color: @mainColor_warn;
				}
			}

			.user {
				font-weight: bold;
				text-transform: capitalize;
				background-color: @mainColor_normal;
				color: #fff;
				padding: 2px 5px;
				border-radius: 10px;
				align-self: flex-start;
			}
			.message {
				margin-left: 5px;
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.chatwindow{
		position: relative;
		bottom: unset;
		right: unset;
		.close {
			left: auto;
			right: -15px;
		}
		.list {
			max-height: 140px;
		}
	}
}
</style>