<template>
	<div class="oauth">
		<div v-if="isError" class="error">
			<p class="title">{{t('oAuth.title')}}</p>
			<p class="infos" v-html="t('oAuth.subtitle')"></p>
		</div>
		<Home v-if="isError" />
	</div>
</template>
<script setup lang="ts">
import { useStoreMain } from "@/store";
import Utils from '@/utils/Utils';
import Store from "@/store/Store";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import Home from './Home.vue';

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const isError = ref<boolean>(false);

onMounted(async () => {
	const error = Utils.getQueryParameterByName("error");
	const code = Utils.getQueryParameterByName("code");
	if(!error && code) {
		console.log(">>>>1")
		const authRes = await storeMain.authenticate({code:code});
		isError.value = !authRes;
		console.log("error?", isError.value);

		if(isError.value) return;

		let redirect = Store.get("redirect");
		if(redirect) {
			Store.remove("redirect");
			window.location.href = redirect;
		}else{
			//Redirect to home
			router.push({name:"home"});
		}
	}else{
		isError.value = true;
	}
});

</script>

<style scoped lang="less">
.oauth{
	.error {
		color: #fff;
		border-radius: 10px;
		padding: 10px;
		background-color: @mainColor_warn;
		margin-bottom: 20px;
		.title {
			font-family: "FuturaExtraBold";
			text-align: center;
			margin-bottom: 10px;
		}
	}
}
</style>