<template>
	<div :class="classes">
		<canvas ref="canvas"></canvas>
		<div class="time" ref="time" :style="timeStyles" v-if="props.timerPercent!=1">{{textDuration}}</div>
	</div>
</template>
<script setup lang="ts">
import Utils from "@/utils/Utils";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

const props = withDefaults(defineProps<{
	timerPercent?:number;
	duration?:number;
}>(), {
	timerPercent:0,
	duration:0,
});

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const time = useTemplateRef<HTMLDivElement>("time");

let cnv:HTMLCanvasElement;
let ctx:CanvasRenderingContext2D;

let radius:number = 0;
let center:{x:number,y:number} = null
const blink = ref<boolean>(false);
let disposed:boolean = false;
let lastBlinkTime:number = 0;

const classes = computed(():string[] => {
	let res = ["timerrenderer"];
	if(blink.value) res.push("blink");
	return res;
});

const timeStyles = computed(():any => {
	let res:any = {};
	return res;
	if(!center || !time.value) return res;

	let a = Math.PI*2 * props.timerPercent-Math.PI/2;
	let bounds = time.value.getBoundingClientRect();
	let px = ((center.x + Math.cos(a) * (radius+30) - bounds.width/2).toFixed(1))+"px";
	let py = ((center.y + Math.sin(a) * (radius+30) - bounds.height/2).toFixed(1))+"px";
	res.top = 0;
	res.left = 0;
	res.transform = 'translate3d('+px+', '+py+', 0)';
	return res;
});

const textDuration = computed(():string => {
	let d = new Date(Math.ceil(props.duration * (1-props.timerPercent)) * 1000);
	if((
		(d.getTime()/1000 < 20 && d.getSeconds()%5 == 0)
		|| d.getTime()/1000 <= 5
	)
	&& d.getSeconds() != lastBlinkTime) {
		lastBlinkTime = d.getSeconds();
		blink.value = true;
	}else{
		blink.value = false;
	}
	return Utils.toDigits(d.getMinutes())+":"+Utils.toDigits(d.getSeconds());
});

onMounted(() => {
	cnv = canvas.value;
	ctx = cnv.getContext("2d");
	let bounds = cnv.getBoundingClientRect();
	cnv.width = bounds.width;
	cnv.height = bounds.height;
	renderFrame();
});

onBeforeUnmount(() => {
	disposed = true;
});

function renderFrame():void {
	if(disposed) return;
	requestAnimationFrame(_ => renderFrame());

	ctx.clearRect(0,0,cnv.width,cnv.height);

	let thickness = 5;
	center = {x:cnv.width/2, y:cnv.height/2};
	radius = Math.min(cnv.width, cnv.height) / 2 - thickness / 2;

	ctx.beginPath();
	ctx.strokeStyle = "rgba(255,255,255,.35";
	ctx.lineWidth = thickness;
	ctx.lineCap = "round";
	ctx.arc(cnv.width*.5, cnv.height*.5,radius,0, Math.PI*2);
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = thickness;
	ctx.lineCap = "round";
	ctx.arc(cnv.width*.5, cnv.height*.5,radius,-Math.PI/2, Math.PI*2*props.timerPercent-Math.PI/2);
	ctx.stroke();

	let res:any = {};

	if(!time.value) return res;

	let a = Math.PI*2 * props.timerPercent-Math.PI/2;
	let div = time.value;
	let bounds = div.getBoundingClientRect();
	let px = ((center.x + Math.cos(a) * (radius+bounds.width*.25) - bounds.width/2))+"px";
	let py = ((center.y + Math.sin(a) * (radius+bounds.height*.25) - bounds.height/2))+"px";
	div.style.transform = 'translate3d('+px+', '+py+', 0)';
	return res;
}

</script>

<style scoped lang="less">
.timerrenderer{
	position: relative;
	canvas {
		width: 100%;
		height: 100%;
	}

	&.blink {
		.time {
			background-color: @mainColor_alert;
			transition: background-color 0s;
		}
	}

	.time {
		position: absolute;
		color: #ffffff;
		background-color: @mainColor_normal;
		border: 2px solid #ffffff;
		padding: .5em;
		border-radius: 5em;
		font-family: Futura;
		font-weight: bold;
		font-size: 1em;
		z-index: 1;
		top: 0;
		left: 0;
		will-change: transform;
		transition: background-color .5s;
	}
}
</style>