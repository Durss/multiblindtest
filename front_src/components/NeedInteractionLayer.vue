<template>
	<div class="needinteractionlayer">
		<div class="dimmer"></div>
		<div class="content">
			<div class="iconHolder">
				<img src="@/assets/icons/unmute.svg" alt="sound" class="icon" ref="icon">
				<img src="@/assets/loader/loader_white.svg" alt="loader" class="loader">
			</div>
			<p class="text">{{t("global.playback")}}</p>
		</div>
	</div>
</template>
<script setup lang="ts">
import gsap from 'gsap';
import { nextTick, onMounted, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const icon = useTemplateRef<HTMLImageElement>("icon");

onMounted(() => {
	nextTick().then(()=>{
		gsap.from(icon.value, {duration: 1, ease:"Elastic.easeOut", scale:1.2, repeat:-1}).yoyo(true);
	})
});

</script>

<style scoped lang="less">
.needinteractionlayer{
	cursor: pointer;
	.dimmer {
		background-color: rgba(255, 255, 255, .75);
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 2;
	}

	.content {
		position: fixed;
		top: 50%;
		left: 50%;
		z-index: 3;
		padding: 20px;
		border-radius: 20px;
		transform: translate(-50%, -50%);
		background-color: @mainColor_warn;
		color: #fff;
		font-size: 30px;
		max-width: 90vw;
		min-width: 250px;

		.iconHolder {
			position: absolute;
			padding: 20px;
			left: 50%;
			transform: translate(-50%, -90%);
			border-radius: 50%;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			background-color: @mainColor_warn;
			
			.icon {
				width: 40px;
			}

			.loader {
				position: absolute;
				width: 70px;
				left: 50%;
				transform: translate(-50%, -20%);
			}
		}

		.text {
			position: relative;
			z-index: 2;
			text-align: center;
		}
	}
}
</style>