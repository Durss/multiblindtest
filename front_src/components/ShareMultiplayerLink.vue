<template>
	<div class="sharemultiplayerlink">
		<h2 class="title">{{$t('group.lobby.share.title')}}</h2>
		<div class="content" ref="content">
			<p class="copied" v-if="showCopied" @click="showCopied = false">{{$t('group.lobby.share.copied')}}</p>
			<p>{{$t('group.lobby.share.send')}}</p>
			<div class="inputs">
				<input type="text" v-model="shareUrl" class="dark" @focus="$event.target.select()">
				<Button :icon="require('@/assets/icons/copy.svg')" :data-tooltip="$t('group.lobby.share.copy')" class="copy" @click="shareCurrentRoom()" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Utils from '../utils/Utils';
import Button from './Button.vue';
import gsap from 'gsap';

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