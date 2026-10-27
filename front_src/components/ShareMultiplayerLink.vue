<template>
	<div class="sharemultiplayerlink">
		<h2 class="title">{{t('group.lobby.share.title')}}</h2>
		<div class="content" ref="content">
			<p>{{t('group.lobby.share.send')}}</p>
			<div class="inputs">
				<input type="text" :value="shareUrl" class="dark" @focus="setFocus($event)" >
				<Button :icon="getIcon('copy')" :data-tooltip="t('group.lobby.share.copy')" class="copy" @click="shareCurrentRoom()" />
			</div>
			<p class="copied" v-if="showCopied" @click="showCopied = false">{{t('group.lobby.share.copied')}}</p>
		</div>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import gsap from 'gsap';
import { computed, nextTick, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import Utils from '../utils/Utils';
import Button from './Button.vue';

const { t } = useI18n();

const content = useTemplateRef<HTMLDivElement>("content");

const showCopied = ref<boolean>(false);

const shareUrl = computed(():string => {
	return window.location.href;
});

/**
 * Copies the current link to share it with people
 */
function shareCurrentRoom():void {
	Utils.copyToClipboard(window.location.href);
	showCopied.value = true;
	setTimeout(() => {
		showCopied.value = false;
	}, 5000);
	nextTick().then(_=> {
		gsap.set(content.value, {filter:"brightness(1)"});
		gsap.from(content.value, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
	})
}

function setFocus(e:FocusEvent):void {
	(e.target as HTMLInputElement).select();
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