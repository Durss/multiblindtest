<template>
	<div class="changelog">
		<h1 class="header">{{t('changelog.title')}}</h1>
		<div v-for="(log, index) in logs" :key="'l_'+index" class="log">
			<div class="date">{{log.date}}</div>
			<ul>
				<li v-for="(update, index) in log.updates" :key="'u_'+index" v-html="update"></li>
			</ul>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, tm, rt } = useI18n();

const logs = computed(():{date:string, updates:string[]}[] => {
	const rawLogs = tm('changelog.logs') as unknown as {date:string, updates:string[]}[];
	return rawLogs.map(log => ({
		date:rt(log.date),
		updates:log.updates.map(u => rt(u)),
	}));
});

</script>

<style scoped lang="less">
.changelog{
	.log {
		margin-bottom: 50px;
		.date {
			font-weight: bold;
			text-align: center;
		}
		ul {
			list-style: disc;
			li {
				margin-bottom: 5px;

				:deep(a) {
					background-color: fade(@mainColor_highlight, 10%);
					padding: 0 5px;
					border-radius: 5px;
					line-height: 22px;
					transition: all .25s;
					&:hover {
						color: @mainColor_warn;
						background-color: fade(#fff, 10%);
					}
				}
			}
		}
	}
}
</style>