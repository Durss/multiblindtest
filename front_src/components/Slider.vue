<template>
	<div class="slider">
		<div class="label" v-html="props.label"></div>
		<div class="gauge">
			<div v-for="(i, index) in (props.max-props.min+1)" :key="i" :class="classes(index+props.min)" @click="clicItem(index+props.min)">{{index+props.min}}</div>
		</div>
	</div>
</template>
<script setup lang="ts">

const props = withDefaults(defineProps<{
	label?:string;
	modelValue?:number;
	min?:number;
	max?:number;
}>(), {
	modelValue:6,
	min:0,
	max:10,
});

const emit = defineEmits<{
	"update:modelValue":[value:number];
}>();

function classes(index:number):string[] {
	let res = ["item"];
	if(props.modelValue == index) res.push("selected");
	return res
}

function clicItem(index:number):void {
	emit("update:modelValue", index);
}

</script>

<style scoped lang="less">
.slider{
	.label {
		font-family: "Futura";
		font-weight: bold;
		text-align: center;
		:deep(i) {
			font-family: "FuturaLight";
			font-weight: normal;
			font-size: 16px;
		}
	}
	.gauge {
		display: flex;
		flex-direction: row;
		justify-content: center;
		.item {
			border-radius: 20px;
			flex-grow: 1;
			cursor: pointer;
			border: 1px solid #fff;
			padding: 5px;
			margin: 10px 0px;
			max-width: 40px;

			&.selected {
				background-color: #fff;
				color: @mainColor_warn;
			}
		}
	}
}
</style>