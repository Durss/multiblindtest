<template>
	<div class="grouplobbyuser" @mouseleave="hover=false" @mouseenter="hover=true">
		<div :class="classes" v-if="true">
			<div class="text" @click="clickName()" v-if="!editName">{{props.data.name}}</div>
			<div v-if="editName" class="editForm">
				<input type="text" v-model="props.data.name" @keyup.enter="submitName()" @keydown.esc="editName=false" maxlength="30" v-focus>
				<Button :icon="getIcon('checkmark')" white @click.stop="submitName()" />
			</div>
			<div v-if="props.data.handicap" class="handicap">
				<img src="@/assets/icons/delay.svg" alt="delay">
				<span>{{props.data.handicap}}s</span>
			</div>
		</div>
		<transition name="expand" >
			<div class="form" v-if="hover">
				<IncrementForm class="incForm" v-model="handicap" :title="t('group.lobby.handicap')" :minValue="0" :maxValue="30" />
				<div>{{t("group.lobby.handicapInfos", {SECONDS:handicap})}}</div>
			</div>
		</transition>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import UserData from '../vo/UserData';
import Button from './Button.vue';
import IncrementForm from './IncrementForm.vue';

const props = defineProps<{
	data?:UserData;
	me?:UserData;
	isHost?:boolean;
}>();

const emit = defineEmits<{
	update:[data:UserData, handicap:number];
	updateName:[data:UserData];
}>();

const { t } = useI18n();

const hover = ref<boolean>(false);
const editName = ref<boolean>(false);
const handicap = ref<number>(0);

const isMe = computed(():boolean => {
	return props.me && props.data.id == props.me.id;
});

const classes = computed(():string[] => {
	let res = ["label"];
	if(isMe.value) res.push("me");
	if(props.data.offline) res.push("offline");
	else if(props.isHost) res.push("host");
	// if(props.data.offline && !isMe) res.push("offline");
	return res;
});

watch(handicap, () => {
	emit("update", props.data, handicap.value);
});

watch(hover, () => {
	handicap.value = props.data.handicap;
});

function clickName():void {
	if(isMe.value) {
		editName.value = true;
	}
}

function submitName():void {
	emit("updateName", props.data);
	editName.value = false;
}

</script>

<style scoped lang="less">
.grouplobbyuser{
	width: 100%;
	margin-bottom: 2px;
	
	.label {
		background-color: @mainColor_normal_light;
		border-radius: 15px;
		padding: 0 10px;
		color: @mainColor_dark;
		display: flex;
		flex-direction: row;

		.text {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 30px;
			width: 180px;
			flex-grow: 1;
		}
	
		&.me {
			font-family: "Futura";
		}
		
		&::before {
			content: " ";
			background-color: @mainColor_normal;
			border-radius: 50%;
			display: inline-block;
			width: 5px;
			height: 5px;
			margin-top: 12px;
			margin-right: 13px;
			margin-left: 7px;
			vertical-align: middle;
		}
	
		&.offline {
			filter: saturate(0%);
			opacity: .5;
			&::before {
				background-color: transparent;
				background-image: url("../assets/icons/offline.svg");
				@ratio: 18 / 68;
				width: calc(68px * @ratio);
				height: calc(59px * @ratio);
				margin-right: 10px;
				margin-left: 0;
				border-radius: 0;
				margin-top: 6px;
				opacity: .5;
			}
		}
		&.host {
			&::before {
				background-color: transparent;
				background-image: url("../assets/icons/king.svg");
				@ratio: 16 / 72;
				width: calc(100px * @ratio);
				height: calc(72px * @ratio);
				margin-right: 5px;
				margin-top: 5px;
				margin-left: 0;
				border-radius: 0;
			}
		}

		.handicap {
			display: flex;
			flex-direction: row;
			align-items: center;
			img {
				height: 16px;
				margin-right: 5px;
			}
			span {
				font-size: 16px;
				color: #fff;
			}
		}

		.editForm {
			display: flex;
			flex-direction: row;
			margin: 5px;
			input {
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
			button {
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}

	.form {
		background-color: @mainColor_normal_extralight;
		border-radius: 15px;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		top: 0;
		width: calc(100% - 26px);
		color: @mainColor_dark;
		box-sizing: border-box;
		margin-left: 13px;
		overflow: hidden;
		transition: all .25s;
		padding: 5px 10px;

		.incForm {
			:deep(.button:hover) {
				background-color: @mainColor_normal_extralight;
			}
		}

		&.expand-enter-active, &.expand-leave-active {
			padding: 5px 10px;
			max-height: 125px;
		}
		&.expand-enter-from, &.expand-leave-to {
			max-height: 0px;
			padding: 0px 10px;
		}
	}
}
</style>