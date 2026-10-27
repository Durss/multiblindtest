<template>
	<div class="expertmodeform">
		<div class="toggle">
			<Button type="checkbox" v-model="enabled" :title="t('group.lobby.expertMode.title')" />
		</div>
		<div v-if="enabled" class="form">
			<p class="infos">{{t("group.lobby.expertMode.details")}}</p>
			<div class="checkboxes">
				<Button type="checkbox" v-model="acceptTitle" :title="t('group.lobby.expertMode.acceptTitle')" />
				<Button type="checkbox" v-model="acceptArtist" :title="t('group.lobby.expertMode.acceptArtist')" />
			</div>
			<div v-if="enabled && !acceptArtist && !acceptTitle" class="selectSomething">{{t('group.lobby.expertMode.selectSomething')}}</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from './Button.vue';

const props = defineProps<{
	modelValue?:string[];
}>();

const emit = defineEmits<{
	"update:modelValue":[value:string[]];
}>();

const { t } = useI18n();

let isMount:boolean = false;
const enabled = ref<boolean>(false);
const acceptTitle = ref<boolean>(true);
const acceptArtist = ref<boolean>(true);

onMounted(() => {
	isMount = true;
	onValueChanged();
	isMount = false;
});

watch(() => props.modelValue, () => onValueChanged());

function onValueChanged():void {
	if(props.modelValue && props.modelValue.length > 0) {
		acceptArtist.value = false;
		acceptTitle.value = false;
		for (let i = 0; i < props.modelValue.length; i++) {
			if(props.modelValue[i] !== null) enabled.value = true;
			if(props.modelValue[i] == "artist") acceptArtist.value = true;
			if(props.modelValue[i] == "title") acceptTitle.value = true;
		}
	}else if(isMount){
		enabled.value = false;
	}
}

watch(acceptArtist, () => update());
watch(acceptTitle, () => update());
watch(enabled, () => update());

function update():void {
	if(!enabled.value) {
		emit("update:modelValue", null);
		return;
	}
	let res = [];
	if(acceptTitle.value) res.push("title");
	if(acceptArtist.value) res.push("artist");
	emit("update:modelValue", res);
}

</script>

<style scoped lang="less">
.expertmodeform{
	.toggle {
		display: flex;
		flex-direction: row;
		align-items: center;
		label {
			margin: 0;
			margin-left: 10px;
			font-size: 18px;
			cursor: pointer;
		}
	}
	.form {
		margin-top: 5px;
		padding: 10px;
		border-top: 1px solid @mainColor_normal;
		background-color: fade(@mainColor_normal, 20%);
		color: @mainColor_dark;
		.infos {
			font-size: 16px;
			width: 260px;
			margin-bottom: 10px;
		}
		.selectSomething {
			margin-top: 10px;
			background-color: @mainColor_warn;
			padding: 5px 10px;
			border-radius: 10px;
			color: #fff;
		}
	}
}
</style>