<template>
	<div class="alert" v-if="message && message.length > 0" @click="close()" ref="rootEl">
		<p v-html="message" class="label"></p>
	</div>
</template>
<script setup lang="ts">
import { useStoreMain } from '@/store';
import gsap from 'gsap';
import { nextTick, ref, useTemplateRef, watch } from 'vue';

const storeMain = useStoreMain();

const rootEl = useTemplateRef<HTMLDivElement>("rootEl");

const message = ref<string>("");

watch(() => storeMain.alert, () => {
	let mess = storeMain.alert;
	if(mess && mess.length > 0) {
		message.value = mess;
		nextTick().then(_=> {
			rootEl.value!.removeAttribute("style");
			gsap.from(rootEl.value!, {duration:.3, height:0, paddingTop:0, paddingBottom:0, ease:"back.out"});
			setTimeout(_=> close(), mess.length/10 * 2000);
		});
	}else{
		nextTick().then(_=> {
			gsap.to(rootEl.value!, {duration:.3, height:0, paddingTop:0, paddingBottom:0, ease:"back.in", onComplete:()=> {
				message.value = null;
			}});
		});
	}
});

function close():void {
	storeMain.alert = null;
}

</script>

<style lang="less">
.alert {
	background-color: #c00;
	color: #fff;
	padding: 20px;
	width: 100%;
	position: absolute;
	overflow: hidden;
	z-index: 1;
	position: fixed;
	top: 0;
	cursor: pointer;

	.label {
		max-width: 600px;
		margin: auto;
		padding: 0 30px 0 10px;
		text-align: center;
		&::after {
			content: " ";
			background-image: url("../assets/icons/cross_white.svg");
			position: absolute;
			top: 16px;
			right: 10px;
			margin-left: 20px;
			width: 20px;
			height: 20px;
		}
	}
}
</style>