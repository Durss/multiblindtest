<template>
	<div class="grouplobbyuser" @mouseleave="hover=false" @mouseenter="hover=true">
		<div :class="classes" v-if="true">
			<div class="text" @click="clickName()" v-if="!editName">{{data.name}}</div>
			<div v-if="editName" class="editForm">
				<input type="text" v-model="data.name" @keyup.enter="submitName()" @keydown.esc="editName=false" maxlength="30" v-focus>
				<Button :icon="require('@/assets/icons/checkmark.svg')" white @click.stop="submitName()" />
			</div>
			<div v-if="data.handicap" class="handicap">
				<img src="@/assets/icons/delay.svg" alt="delay">
				<span>{{data.handicap}}s</span>
			</div>
		</div>
		<transition name="expand" >
			<div class="form" v-if="hover">
				<IncrementForm class="incForm" v-model="handicap" :title="$t('group.lobby.handicap')" minValue="0" maxValue="30" />
				<div>{{$t("group.lobby.handicapInfos", {SECONDS:handicap})}}</div>
			</div>
		</transition>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import UserData from '../vo/UserData';
import IncrementForm from './IncrementForm.vue';
import SockController, { SOCK_ACTIONS } from '../sock/SockController';
import Button from './Button.vue';

@Component({
	components:{
		Button,
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

	public hover:boolean = false;
	public editName:boolean = false;
	public handicap:number = 0;

	public get isMe():boolean {
		return this.me && this.data.id == this.me.id;;
	}

	public get classes():string[] {
		let res = ["label"];
		if(this.isMe) res.push("me");
		if(this.data.offline) res.push("offline");
		else if(this.isHost) res.push("host");
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

	@Watch("hover")
	private onHover():void {
		this.handicap = this.data.handicap;
	}

	private clickName():void {
		if(this.isMe) {
			this.editName = true;
		}
	}

	private submitName():void {
		this.$emit("updateName", this.data);
		this.editName = false;
	}

}
</script>

<style scoped lang="less">
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

		.editForm {
			display: flex;
			flex-direction: row;
			margin: 5px;
			input {
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
			button {
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}

	.form {
		background-color: @mainColor_normal_extralight;
		border-radius: 15px;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		top: 0;
		width: calc(100% - 26px);
		color: @mainColor_dark;
		box-sizing: border-box;
		margin-left: 13px;
		overflow: hidden;
		transition: all .25s;
			padding: 5px 10px;

		.incForm {
			::v-deep .button:hover {
				background-color: @mainColor_normal_extralight;
			}
		}

		&.expand-enter-active, &.expand-leave-active {
			padding: 5px 10px;
			max-height: 125px;
		}
		&.expand-enter, &.expand-leave-to {
			max-height: 0px;
			padding: 0px 10px;
		}
	}
}
</style>