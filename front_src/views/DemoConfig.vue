<template>
	<div class="democonfig">
		<div class="header">
			<h1>{{t("demo.title")}}</h1>
			<p>{{t("demo.description")}}</p>
		</div>

		<div class="content">
			<Button v-for="index in 5" :key="index"
			class="number"
			:icon="getIcon('song')"
			:title="'x '+(index+1)"
			:to="{name:'demo/play', params:{trackscounts:index+1}}" />
		</div>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import { useI18n } from "vue-i18n";
import Button from '../components/Button.vue';

const { t } = useI18n();

</script>

<style scoped lang="less">
.democonfig{
	
	.header {
		h1 {
			margin-bottom: 10px;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		.number {
			font-size: 40px;
			margin-bottom: 10px;
			:deep(.icon) {
				width: 40px;
			}
		}
	}
}
</style>