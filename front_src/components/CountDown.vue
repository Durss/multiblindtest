<template>
	<div class="countdown">
		<div v-for="index in delay" :key="index" ref="number" class="number">{{(delay - index==0)? "GO" : delay - index}}</div>
	</div>
</template>
<script setup lang="ts">
import { useStoreMain } from '@/store';
import gsap from 'gsap';
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import Beeper from '../utils/Beeper';

const props = withDefaults(defineProps<{
	seconds?:number;
	additionalTime?:number;
}>(), {
	seconds:4,
	additionalTime:0,
});

const emit = defineEmits<{
	complete:[];
	"3SecComplete":[];
}>();

const storeMain = useStoreMain();

const number = useTemplateRef<HTMLDivElement[]>("number");

let timeout1:number;
let timeout2:number;
let timeoutBeeps:number;

const delay = computed(():number => {
	return props.seconds + props.additionalTime;
});

onMounted(() => {
	let nbrs = number.value;
	if(!nbrs) return;

	for (let i = 0; i < nbrs.length; i++) {
		const element = nbrs[i];
		gsap.set(nbrs[i], {scale:0, opacity:0});
		gsap.to(nbrs[i], {duration: .1, scale:1, opacity:1, delay:i});
		gsap.to(nbrs[i], {duration: .1, scale:.5, opacity:0, delay:i+.9});
	}
	let volume = storeMain.volume / 2;
	let beeps = [];
	let len = 3;//props.seconds - 1
	for (let i = 0; i < len; i++) {
		beeps.push({d:100, f:800, p:900});
	}
	beeps.push({d:300, f:1600})
	let delay = (props.seconds + props.additionalTime) - 4;
	clearTimeout(timeoutBeeps);
	//Start beeps only for last 4 seconds
	timeoutBeeps = setTimeout(_=>{
		Beeper.instance.beepPatern(beeps, volume);
	}, delay * 1000);

	clearTimeout(timeout1);
	timeout1 = setTimeout(_=> {
		emit("complete")
	}, (props.seconds + props.additionalTime) * 1000-500);

	if(props.additionalTime > 0) {
		clearTimeout(timeout2);
		timeout2 = setTimeout(_=> {
			emit("3SecComplete")
		}, props.seconds * 1000-500);
	}
});

onBeforeUnmount(() => {
	Beeper.instance.stopAll();
	clearTimeout(timeout1);
	clearTimeout(timeout2);
});

</script>

<style scoped lang="less">
.countdown{
	pointer-events: none;
	.number {
		font-size: 50vh;
		font-family: "FuturaExtraBold";
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		color: #fff;
		text-shadow: rgba(0,0,0,.25) 2px 2px 4px;
	}
}
</style>