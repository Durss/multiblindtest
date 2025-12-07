<template>
	<div class="sharemultiplayerlink">
		<h2 class="title">{{$t('group.lobby.share.title')}}</h2>
		<div class="content" ref="content">
			<p>{{$t('group.lobby.share.send')}}</p>
			<div class="inputs">
				<input type="text" v-model="shareUrl" class="dark" @focus="setFocus($event)" >
				<Button :icon="$getIcon('copy')" :data-tooltip="$t('group.lobby.share.copy')" class="copy" @click="shareCurrentRoom()" />
			</div>
			<p class="copied" v-if="showCopied" @click="showCopied = false">{{$t('group.lobby.share.copied')}}</p>
		</div>
	</div>
</template>

<script lang="ts">
import gsap from 'gsap';
import { Component, Vue } from "vue-property-decorator";
import Utils from '../utils/Utils';
import Button from './Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class ShareMultiplayerLink extends Vue {

	public showCopied:boolean = false;

	public get shareUrl():string {
		return window.location.href;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
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
			gsap.set(this.$refs.content, {filter:"brightness(1)"});
			gsap.from(this.$refs.content, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
		})
	}

	public setFocus(e:FocusEvent):void {
		(e.target as HTMLInputElement).select();
	}

}
</script>

<style scoped lang="less">
.sharemultiplayerlink{
	margin: auto;
	margin-top: 50px;
	width: min-content;
	border-radius: 20px;
	opacity: .8;

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