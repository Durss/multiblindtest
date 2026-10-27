<template>
	<div :class="classes">
		<div class="loader">
			<svg class="bg" :style="bgLoaderStyle" viewBox="0 0 247.1 150.9">
				<path class="st0" d="M247.1,150.9c-23.4-4.9-32.2-35.5-36.6-64l0,0c0-48-38.9-86.9-86.9-86.9S36.6,38.9,36.6,86.9l0,0 c-4.3,28.5-8.6,58.9-36.6,64H247.1z"/>
			</svg>
			<img src="@/assets/loader/loader_white.svg" alt="loader" class="spinner">
		</div>
		<span v-html="props.label" class="label" :style="labelStyle"></span>
	</div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Utils from '../utils/Utils';

const props = withDefaults(defineProps<{
	label?:string;
	theme?:string;
	big?:boolean;
}>(), {
	label:"Loading...",
	big:false,
});

const localColor = ref<string>(null);

const classes = computed(():string[] => {
	let res = ["SimpleLoader"];
	if(props.big !== false) res.push("big");
	return res;
});

const bgLoaderStyle = computed(():any => {
	return {
		fill:localColor.value,
	}
});

const labelStyle = computed(():any => {
	return {
		backgroundColor:localColor.value,
	}
});

onMounted(() => {
	if(!props.theme) {
		localColor.value = Utils.getLessVars().mainColor_warn;
	}else{
		localColor.value = Utils.getLessVars()[props.theme];
	}
});

</script>

<style scoped lang="less">
.SimpleLoader{
	display: flex;
	flex-direction: column;
	align-items: center;

	span {
		font-style: italic;
		color: #fff;
		text-align: center;
		flex-grow: 1;
		border-radius: 50px;
		padding: 10px;
	}

	.loader {
		position: relative;
		width: 60px;
		height: 36px;

		.spinner {
			position: absolute;
			width: 20px;
			height: 20px;
			top: 0;
			left: 0;
			padding: 10px 20px;
		}
	}

	&.big {
		span {
			font-size: 35px;
			padding: 15px 25px;
		}

		.loader {
			width: 90px;
			height: 53px;

			.spinner {
				width: 40px;
				height: 40px;
				padding: 10px 25px;
			}
		}
	}
}
</style>