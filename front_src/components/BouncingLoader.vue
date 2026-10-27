<template>
	<div class="bouncingloader">
		<img src="@/assets/loader/loader.svg" class="loader">
		<img :src="props.icon" class="icon" ref="icon">
		<div class="title">
			<span v-if="props.label">{{ props.label }}</span>
			<slot></slot>
		</div>
	</div>
</template>
<script setup lang="ts">
import gsap from "gsap";
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";

const props = defineProps<{
	icon?: string;
	label?: string;
}>();

const icon = useTemplateRef<HTMLImageElement>("icon");

onMounted(() => {
	gsap.to(icon.value, { duration: 1, ease: "Elastic.easeIn", scale: 1.2, repeat: -1 }).yoyo(true);
});

onBeforeUnmount(() => {
	gsap.killTweensOf(icon.value);
});

</script>

<style scoped lang="less">
.bouncingloader {
	margin: auto;
	position: relative;

	.title {
		position: relative;
		font-size: 20px;
		padding-top: 110px;
		text-align: center;
		width: 100%;
	}

	.loader {
		position: absolute;
		width: 100px;
		height: 100px;
		left: 50%;
		transform: translate(-50%, 0);
	}

	.icon {
		position: absolute;
		width: 40px;
		top: 30px;
		left: 50%;
		transform: translate(-50%, 0);
	}
}
</style>