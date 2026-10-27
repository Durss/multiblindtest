<template>
	<div class="twitchintro">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>{{t('twitch.intro.title')}}</h1>
		<div class="content">
			<div class="head">
				<p>{{t('twitch.intro.head1')}}</p>
				<p>{{t('twitch.intro.head2')}}</p>
			</div>
		</div>
		<Button :icon="getIcon('twitch')" :title="t('twitch.intro.proceed')" :to="{name:'twitch/auth'}" />
	</div>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";
import { getIcon } from "@/utils/Icons";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const twitchName = ref<string>("");
const error = ref<boolean>(false);
const success = ref<boolean>(false);
const sendingTwitchName = ref<boolean>(false);

</script>

<style scoped lang="less">
.twitchintro{
	display: flex;
	flex-direction: column;
	align-items: center;

	.logo {
		height: 200px;
	}
	&>* {
		margin-bottom: 20px;
	}
	strong {
		color: @mainColor_warn;
	}

	.head {
		margin-bottom: 20px;
		text-align: center;
		font-size: 20px;
	}

	.error {
		color: #fff;
		background-color: @mainColor_alert;
		border-radius: 10px;
		margin: auto;
		margin-bottom: 20px;
		margin-top: -20px;
		padding: 5px;
		width: min-content;
		white-space: nowrap;
	}

	.success {
		font-weight: bold;
		margin-bottom: 20px;
		text-align: center;
		color: #fff;
		padding: 5px;
		border-radius: 10px;
		background-color: @mainColor_normal;
	}

	.form {
		display: flex;
		flex-direction: row;
		justify-content: center;
		margin-bottom: 20px;
		input {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}
		.submit {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
	}
}
</style>