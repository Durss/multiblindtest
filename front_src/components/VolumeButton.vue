<template>
	<div :class="classes" @mouseover="isMouseOver = true;" @mouseout="isMouseOver = false;" @touchstart="onTouchStartHolder">
		<img class="icon" v-if="mute" src="@/assets/icons/mute.svg" alt="mute" @click="onClick">
		<img class="icon" v-if="!mute" src="@/assets/icons/unmute.svg" alt="unmute" @click="onClick">
		<div class="percent">{{Math.round(volume*100)}}%</div>
		<div class="content" @mousedown="onPress" @touchstart="onPress">
			<svg viewBox="0 0 20 150" class="bar" ref="arrow">
				<polygon points="10,150 0,0 20,0"/>
			</svg>
			<svg viewBox="0 0 20 150" class="arrow" :style="styles">
				<polygon points="10,150 0,0 20,0"/>
			</svg>
		</div>
	</div>
</template>
<script setup lang="ts">
import { useStoreMain } from "@/store";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

const props = withDefaults(defineProps<{
	twitchMode?:boolean;
	horizontal?:boolean;
}>(), {
	twitchMode:false,
	horizontal:false,
});

const storeMain = useStoreMain();

const arrow = useTemplateRef<SVGElement>("arrow");

const expand = ref<boolean>(false);
const dragging = ref<boolean>(false);
const isMouseOver = ref<boolean>(false);
const prevVolume = ref<number>(.5);
const volume = ref<number>(.5);

let mouseUpHandler:any;
let mouseMoveHandler:any;

const mute = computed(():boolean => {
	return volume.value == 0;
});

const classes = computed(():string[] => {
	let res = ["volumebutton"];
	if(expand.value) res.push("expand");
	if(props.twitchMode !== false) res.push("twitchMode");
	if(props.horizontal !== false) res.push("horizontal");
	return res;
});

const styles = computed(():any => {
	let percent = (1-volume.value) * 100;
	return {
		clipPath: "polygon(0 "+percent+"%, 100% "+percent+"%, 100% 100%, 0 100%)",
	}
});

onMounted(() => {
	volume.value = prevVolume.value = storeMain.volume;

	mouseUpHandler = (e) => onRelease(e);
	mouseMoveHandler = (e) => onMove(e);
	document.addEventListener("mouseup", mouseUpHandler);
	document.addEventListener("touchend", mouseUpHandler);
	document.addEventListener("mousemove", mouseMoveHandler);
	document.addEventListener("touchmove", mouseMoveHandler);
});

onBeforeUnmount(() => {
	document.removeEventListener("mouseup", mouseUpHandler);
	document.removeEventListener("touchend", mouseUpHandler);
	document.removeEventListener("mousemove", mouseMoveHandler);
	document.removeEventListener("touchmove", mouseMoveHandler);
});

function onTouchStartHolder(e:TouchEvent):void {
	if(!isMouseOver.value) {
		e.preventDefault();
	}
	isMouseOver.value = true;
}

function onClick():void {
	if(volume.value > 0) prevVolume.value = volume.value;
	if(expand.value) {
		volume.value = volume.value > 0? 0 : prevVolume.value == 0? .5 : prevVolume.value;
	}
}

function onPress(e:MouseEvent|TouchEvent):void {
	dragging.value = true;
	onMove(e);
}

function onRelease(e:MouseEvent|TouchEvent):void {
	dragging.value = false;
	if(!isMouseOver.value) expand.value = false;
}

function onMove(e:MouseEvent|TouchEvent):void {
	if(!dragging.value) return;
	let bounds = arrow.value.getBoundingClientRect();
	if(props.horizontal !== false) {
		let mouseX = e instanceof MouseEvent? (<MouseEvent>e).clientX : (<TouchEvent>e).touches[0].clientX;
		volume.value = Math.min(1, Math.max(0, (mouseX - bounds.left)/bounds.width));
	}else{
		let mouseY = e instanceof MouseEvent? (<MouseEvent>e).clientY : (<TouchEvent>e).touches[0].clientY;
		volume.value = Math.min(1, Math.max(0, 1-(mouseY - bounds.top)/bounds.height));
	}
}

watch(isMouseOver, () => {
	if(!isMouseOver.value && !dragging.value) expand.value = false;
	if(isMouseOver.value) expand.value = true;
});

watch(volume, () => {
	storeMain.setVolume(volume.value);
});

</script>

<style scoped lang="less">
.volumebutton{
	position: fixed;
	top: 0;
	right: 0;
	background-color: @mainColor_normal;
	border-bottom-left-radius: 40px;
	overflow: hidden;
	transition: height .25s;
	height: 78px;
	width: 78px;
	user-select: none;

	&.expand {
		height: 270px;
		.percent, .content {
			opacity: 1;
		}
	}

	&.twitchMode {
		top: 50%;
		right: auto;
		left: 0;
		transform: translate(0, -50%);
		width: 40px;
		height: 40px;
		border-radius: 20px;
		border-bottom-left-radius: 0;
		border-top-left-radius: 0;
		.icon {
			width:20px;
			height:25px;
			padding: 8px;
		}

		&.expand {
			height: 200px;
		}

		.content {
			width: 100%;
			height: 120px;
		}
	}

	&.horizontal {
		position: relative;
		top: 50%;
		right: auto;
		left: 0;
		transform: translate(0, -50%);
		width: 220px;
		height: 40px;
		border-radius: 20px;
		padding: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		.icon {
			width:20px;
			height:25px;
			padding: 0px;
		}

		&.expand {
			height: 40px;
		}
		.content {
			transform: rotate(90deg) translate(0, 0%);
			width: 120px;
			height: 120px;
			margin: 0;
			padding: 0;
			opacity: 1;
		}
		.percent {
			opacity: 1;
			width: 50px;
			margin-bottom: 0px;
		}
	}

	.icon {
		width:40px;
		height:40px;
		padding: 20px;
		padding-bottom: 5px;
		cursor: pointer;
	}

	.percent {
		text-align: center;
		color: #fff;
		margin-bottom: 5px;
		opacity: 0;
		transition: opacity .25s;
	}

	.content {
		position: relative;
		margin: auto;
		display: block;
		width: 60px;
		height: 150px;
		opacity: 0;
		transition: opacity .25s;

		.bar, .arrow {
			width: 100%;
			height: 100%;
			fill: rgba(255, 255, 225, .5);
			cursor: pointer;
			&.arrow {
				position: absolute;
				top: 0;
				left: 0;
				fill: #fff;
				clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.volumebutton{
		width: 49px;
		height: 49px;
		border-bottom-left-radius: 25px;

		&.expand {
			height: 245px;
		}

		.percent {
			font-size: 16px;
		}

		.icon {
			width:25px;
			height:25px;
			padding: 13px;
		}
	}
}
</style>