<template>
	<div class="incrementform">
		<label class="title" :for="inputId" v-if="props.title">{{ props.title }}</label>
		<div class="content" @mousewheel="onMouseWheel">
			<Button :icon="getIcon('minus2')" @pointerdown="startIncrement(-10 * props.step);"
				@pointerup="stopIncrement()" @pointerleave="stopIncrement()" @pointercancel="stopIncrement()"
				class="button" v-if="props.tenStep" />
			<Button :icon="getIcon('minus')" @pointerdown="startIncrement(-props.step);"
				@pointerup="stopIncrement()" @pointerleave="stopIncrement()" @pointercancel="stopIncrement()"
				class="button" />
			<input type="number" v-model.lazy="valueLocal" :min="props.minValue" :max="props.maxValue" class="dark"
				:id="inputId">
			<Button :icon="getIcon('plus')" @pointerdown="startIncrement(props.step);"
				@pointerup="stopIncrement()" @pointerleave="stopIncrement()" @pointercancel="stopIncrement()"
				class="button" />
			<Button :icon="getIcon('plus2')" @pointerdown="startIncrement(10 * props.step);"
				@pointerup="stopIncrement()" @pointerleave="stopIncrement()" @pointercancel="stopIncrement()"
				class="button" v-if="props.tenStep" />
		</div>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Button from './Button.vue';

const props = withDefaults(defineProps<{
	title?: string;
	modelValue?: number;
	minValue?: number;
	maxValue?: number;
	step?: number;
	tenStep?: boolean;
}>(), {
	minValue: 1,
	maxValue: 30,
	step: 1,
	tenStep: false,
});

const emit = defineEmits<{
	"update:modelValue": [value: number];
}>();

const inputId: string = "incrementInput_" + Math.round(Math.random() * 999999);
let incTimeout: number;
let incInterval: number;
const valueLocal = ref<number>(0);

onMounted(() => {
	valueLocal.value = props.modelValue;
});

onBeforeUnmount(() => {
	stopIncrement();
});

watch(() => props.modelValue, () => {
	valueLocal.value = props.modelValue;
});

watch(valueLocal, () => {
	valueLocal.value = Math.max(props.minValue, Math.min(props.maxValue, valueLocal.value));
	emit("update:modelValue", valueLocal.value);
});

function onMouseWheel(e: WheelEvent): void {
	let delta = e.deltaY ? e.deltaY : e.deltaX;
	if (delta > 0) doInc(-props.step);
	if (delta < 0) doInc(props.step);
	e.preventDefault();
}

function startIncrement(inc: number): void {
	doInc(inc);
	stopIncrement();
	//Only start auto-repeat after a hold delay, otherwise a touchpad tap (which
	//keeps the button down ~300ms) increments multiple times
	incTimeout = setTimeout(_ => {
		incInterval = setInterval(_ => { doInc(inc); }, 100);
	}, 500);
}

function stopIncrement(): void {
	clearTimeout(incTimeout);
	clearInterval(incInterval);
}

function doInc(value: number): void {
	valueLocal.value += value;
	valueLocal.value = Math.round(valueLocal.value * 100) / 100;//Prevents fucked up JS number rounding that creates values like 1.000000001
}

</script>

<style scoped lang="less">
.incrementform {
	.title {
		white-space: nowrap;
		font-size: 18px;
		display: block;
	}

	.content {
		display: flex;
		flex-direction: row;
		justify-content: center;
		color: @mainColor_dark;

		// .blockContent();
		.count {
			border: 1px solid @mainColor_normal;
			font-weight: bold;
			border-radius: 10px;
			padding: 7px;
			margin: 0 10px;
		}

		input {
			width: 35px;
			padding: 0;
			text-align: center;
			margin: 0 10px;

			//Disable up/down arrows
			&::-webkit-inner-spin-button,
			&::-webkit-outer-spin-button {
				appearance: none;
				margin: 0;
			}
		}

		.button {
			width: 25px;
			height: 25px;
			padding: 0;

			:deep(img) {
				width: auto;
				max-height: 60%;
				max-width: 90%;
			}
		}
	}
}
</style>