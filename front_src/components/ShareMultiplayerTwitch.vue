<template>
	<div class="sharemultiplayertwitch">
		<h2 class="title">
			<img src="@/assets/icons/twitch.svg" alt="twitch">
			<span>{{$t('group.lobby.twitch.title')}}</span>
		</h2>
		<div class="content" ref="content">
			<p>{{$t('group.lobby.twitch.send')}}</p>
			<div class="inputs">
				<input type="text" v-model="shareUrl" class="dark" @focus="$event.target.select()">
				<Button :icon="require('@/assets/icons/copy.svg')" :data-tooltip="$t('group.lobby.twitch.copy')" class="copy" @click="shareCurrentRoom()" />
			</div>
			<p class="copied" v-if="showCopied" @click="showCopied = false">{{$t('group.lobby.twitch.copied')}}</p>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from "./Button.vue";

@Component({
	components:{
		Button,
	}
})
export default class ShareMultiplayerTwitch extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.sharemultiplayertwitch{
	margin: auto;
	margin-top: 50px;
	width: min-content;
	border-radius: 20px;
	opacity: .8;
	.title {
		img {
			width: 30px;
			vertical-align: middle;
			margin-right: 10px;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		.blockContent();
		.copied {
			background-color: @mainColor_highlight;
			color: #fff;
			border-radius: 50px;
			padding: 5px 10px;
			text-align: center;
		}
		p {
			margin-bottom: 10px;
		}
		.inputs {
			display: flex;
			flex-direction: row;
			input {
				width: auto;
			}
			.copy {
				height: 38px;
				min-height: 38px;
				width: 38px;
				min-width: 38px;
				margin-left:2px;
			}
		}
	}
	
}
</style>