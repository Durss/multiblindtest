<template>
	<div class="twitchextensionconfiguration">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>{{t('twitch.extension.noConfig')}}</h1>
		<div>{{t('twitch.extension.head')}}</div>
		<Button type="link" target="_blank" :to="url" :icon="getIcon('ext_link_white')" :title="t('twitch.extension.startGame')" />
	</div>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";
import Config from "@/utils/Config";
import { getIcon } from "@/utils/Icons";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const url = computed(():string => {
	return Config.BASE_URL+router.resolve({name:"twitch"}).href.replace("#", "");
});

</script>

<style scoped lang="less">
.twitchextensionconfiguration{
	text-align: center;
	*> {
		margin-bottom: 10px;
	}
	.logo {
		width: 150px;
	}
}
</style>