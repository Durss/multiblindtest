<template>
	<div :class="(hidden? 'hidden ' : '') + 'confirmView'">
		<div class="dimmer" ref="dimmer" @click="answer(false)"></div>
		<div class="holder" ref="holder">
			<div class="title" v-html="title"></div>
			<div class="description" v-html="description"></div>
			<div class="buttons">
				<Button class="cancel" type="cancel" @click="answer()" :title="t('global.no')" />
				<Button class="confirm" @click="answer(true)" :title="t('global.yes')" />
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import Button from '@/components/Button.vue';
import { useStoreMain } from '@/store';
import gsap from 'gsap';
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const storeMain = useStoreMain();

const dimmer = useTemplateRef<HTMLDivElement>("dimmer");
const holder = useTemplateRef<HTMLDivElement>("holder");

const title = ref<string>("");
const description = ref<string>("");
const hidden = ref<boolean>(true);

onMounted(() => {
	document.addEventListener("keydown", (e:KeyboardEvent) => onKeyDown(e))
});

watch(() => storeMain.confirm, () => onConfirmChanged(), { immediate: true, deep: true });

function onConfirmChanged() {
	let isHidden = !storeMain.confirm || !storeMain.confirm.title;

	if(hidden.value == isHidden) return;//No change, ignore

	if(!isHidden) {
		hidden.value = isHidden;
		title.value = storeMain.confirm.title;
		description.value = storeMain.confirm.description;
		//@ts-ignore
		document.activeElement.blur();//avoid clicking again on focused button if submitting confirm via SPACE key
		gsap.killTweensOf([holder.value, dimmer.value]);
		gsap.set(holder.value, {marginTop:0, opacity:1});
		gsap.to(dimmer.value, {duration:.25, opacity:1});
		gsap.from(holder.value, {duration:.25, marginTop:100, opacity:0, ease:"back.out"});
	}else{
		gsap.killTweensOf([holder.value, dimmer.value]);
		gsap.to(dimmer.value, {duration:.25, opacity:0});
		gsap.to(holder.value, {duration:.25, marginTop:100, opacity:0, ease:"back.out", onComplete:()=> {
			hidden.value = true;
		}});
	}
}

function onKeyDown(e:KeyboardEvent):void {
	if(hidden.value) return;
	if(e.keyCode == 13 || e.keyCode == 32) {//Enter / space
		answer(true);
		e.preventDefault();
		e.stopPropagation();
	}
	if(e.keyCode == 27) {//escape
		answer(false);
		e.preventDefault();
		e.stopPropagation();
	}
}

function answer(confirm?:boolean):void {
	if(!storeMain.confirm) return;

	if(confirm) {
		if(storeMain.confirm.confirmCallback) {
			storeMain.confirm.confirmCallback();
		}
	}else{
		if(storeMain.confirm.cancelCallback) {
			storeMain.confirm.cancelCallback();
		}
	}
	storeMain.confirm = null;
}

</script>

<style lang="less" scoped>
.confirmView {
	z-index: 99;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	&.hidden {
		display: none;
	}
	.dimmer {
		position: absolute;
		top: 0;
		left: 0;
		background-color: rgba(0,0,0,.5);
		width: 100%;
		height: 100%;
	}

	.holder {
		.center();
		position: absolute;
		background-color: #fff;
		padding: 30px;
		width: 400px;
		box-sizing: border-box;
		border-radius: 20px;

		.title {
			font-size: 25px;
			font-weight: bold;
			text-align: center;
			font-family: "Futura";
		}

		.description {
			margin-top: 20px;
			font-family: "FuturaLight";
		}

		.buttons {
			display: flex;
			flex-direction: row;
			max-width: 220px;
			margin: auto;
			margin-top: 30px;
			justify-content: space-between;

			button {
				width: 100px;
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.confirm {
		.holder {
			padding: 15px;
			width: 90vw;

			.title {
				font-size: 22px;
			}

			.buttons {
				margin-top: 15px;
				button {
					font-size: 18px;
					padding: 10px;
				}
			}
		}
	}
}

@media only screen and (max-width: 360px) {
	.confirm {
		.holder {
			padding: 15px;
			width: 90vw;

			.title {
				font-size: 20px;
			}

			.buttons {
				margin-top: 15px;
				button {
					font-size: 15px;
					padding: 10px;
				}
			}
		}
	}
}
</style>

<style lang="less">

.confirm {

	.holder {
		.description {
			strong {
				color: @mainColor_warn;
				font-weight: bold;
			}
		}
	}
}
</style>