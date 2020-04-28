<template>
	<div class="grouplobbyuser" @mouseleave="hover=false" @mouseenter="hover=true">
		<div :class="classes" v-if="!hover">
			<div class="text">{{data.name}}</div>
			<div v-if="data.handicap" class="handicap">
				<img src="@/assets/icons/delay.svg" alt="delay">
				<span>{{data.handicap}}s</span>
			</div>
		</div>
		<div class="form" v-if="hover">
			<IncrementForm class="incForm" v-model="handicap" :title="$t('group.lobby.handicap')" minValue="0" maxValue="30" />
			<div>{{$t("group.lobby.handicapInfos", {SECONDS:handicap})}}</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import UserData from '../vo/UserData';
import IncrementForm from './IncrementForm.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';

@Component({
	components:{
		IncrementForm
	}
})
export default class GroupLobbyUser extends Vue {

	@Prop()
	public data:UserData;

	@Prop()
	public me:UserData;
	
	@Prop()
	public isHost:boolean;

	public userName:string;
	public hover:boolean = false;
	public handicap:number = 0;

	public get classes():string[] {
		let res = ["label"];
		let isMe = this.me && this.data.id == this.me.id;
		if(isMe) res.push("me");
		if(this.isHost) res.push("host");
		if(this.data.offline) res.push("offline");
		// if(this.data.offline && !isMe) res.push("offline");
		return res;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	@Watch("handicap")
	private onhandicapUpdate():void {
		this.$emit("update", this.data, this.handicap);
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.grouplobbyuser{
	width: 100%;
	margin-bottom: 2px;
	
	.label {
		background-color: @mainColor_normal_light;
		border-radius: 15px;
		padding: 0 10px;
		color: @mainColor_dark;
		display: flex;
		flex-direction: row;

		.text {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 30px;
			width: 180px;
			flex-grow: 1;
		}
	
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
			margin-top: 12px;
			margin-right: 13px;
			margin-left: 7px;
			vertical-align: middle;
		}
	
		&.offline {
			filter: saturate(0%);
			opacity: .5;
			&::before {
				background-color: transparent;
				background-image: url("../assets/icons/offline.svg");
				@ratio: 18 / 68;
				width: 68px * @ratio;
				height: 59px * @ratio;
				margin-right: 10px;
				margin-left: 0;
				border-radius: 0;
				margin-top: 6px;
				opacity: .5;
			}
		}
		&.host {
			&::before {
				background-color: transparent;
				background-image: url("../assets/icons/king.svg");
				@ratio: 16 / 72;
				width: 100px * @ratio;
				height: 72px * @ratio;
				margin-right: 5px;
				margin-top: 5px;
				margin-left: 0;
				border-radius: 0;
			}
		}

		.handicap {
			display: flex;
			flex-direction: row;
			align-items: center;
			img {
				height: 16px;
				margin-right: 5px;
			}
			span {
				font-size: 16px;
				color: #fff;
			}
		}
	}

	.form {
		min-height: 30px;
		background-color: @mainColor_normal_light;
		border-radius: 15px;
		padding: 5px 10px;
		top: 0;
		color: @mainColor_dark;

		.incForm {
			::v-deep .button:hover {
				background-color: @mainColor_normal_extralight;
			}
		}
	}
}
</style>