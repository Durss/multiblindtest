<template>
	<div class="gameparams">
		<h2>{{t('group.lobby.params')}}</h2>
		<div class="content">
			<IncrementForm class="increment" :title="t('group.lobby.gameDuration')" v-model="gameDuration" :maxValue="900" :minValue="10" :tenStep="true"/>
			<IncrementForm class="increment" :title="t('group.lobby.gamesCount')" v-model="gamesCount" :maxValue="99" />
			<IncrementForm class="increment" :title="t('group.lobby.tracksCount')" v-model="tracksCount" :maxValue="6" />
			<slot></slot>
			<Button type="checkbox" v-model="acceptAlbum" :title="t('group.lobby.acceptAlbum')" />
			<ExpertModeForm v-model="expertMode" />
		</div>
	</div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./Button.vue";
import ExpertModeForm from "./ExpertModeForm.vue";
import IncrementForm from "./IncrementForm.vue";

const gamesCount = defineModel<number>("gamesCount", {default:10});
const gameDuration = defineModel<number>("gameDuration", {default:120});
const tracksCount = defineModel<number>("tracksCount", {default:4});
const acceptAlbum = defineModel<boolean>("acceptAlbum", {default:false});
const expertMode = defineModel<string[]>("expertMode", {default:null});

const { t } = useI18n();

</script>

<style scoped lang="less">
.gameparams{
	.content {
		.blockContent();
	}
}
</style>