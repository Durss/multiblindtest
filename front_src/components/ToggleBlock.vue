<template>
	<div :class="classes">
		<h2 @click="toggle()">
			<span class="handle" v-if="props.enabled">{{(showContent? "▼":"►")}}</span>
			<img :src="props.icon" v-if="props.icon" class="icon">
			<span class="title">{{props.title}}</span>
		</h2>
		<div class="content" v-if="showContent">
			<slot :close="close"></slot>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{
	title?:string;
	icon?:string;
	closed?:boolean;
	enabled?:boolean;
	small?:boolean;
}>(), {
	closed:null,
	enabled:true,
	small:false,
});

const showContent = ref<boolean>(true);

const classes = computed(():string[] => {
	let res = ["toggleblock"];
	if(props.enabled) res.push("enabled");
	if(showContent.value) res.push("open");
	if(props.small !== false) res.push("small");
	if(!props.enabled && props.closed) res.push("disabled");
	return res;
});

onMounted(() => {
	showContent.value = props.closed == null;
});

function open():void {
	showContent.value = true;
}

function close():void {
	showContent.value = false;
}

function toggle():void {
	if(!props.enabled) return;
	showContent.value = !showContent.value;
}

defineExpose({ open, close });

</script>

<style scoped lang="less">
.toggleblock{
	&.enabled {
		h2 {
			cursor:pointer;
			&:hover {
				background-color: darken(@mainColor_light, 2%);
			}
		}
	}

	h2 {
		margin-bottom: 0px;
		transition: background-color .25s;
		border-radius: 20px;
		.handle {
			margin-right: 10px;
		}
		.icon {
			height: 30px;
			vertical-align: bottom;
			margin-right: 10px;
		}
	}

	.content {
		background-color: #ffffff;
		margin: auto;
		padding: 10px;
		box-sizing: border-box;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
	}

	&.open {
		h2 {
			margin-bottom: 0px;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}
	}

	&.small {
		h2 {
			padding: 0 0 5px 0;
			margin: 0;
			border-radius: 10px;
			margin-bottom: 10px;
		}

		&.open {
			h2 {
				margin-bottom: 0;
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
			}
		}

		.content {
			padding: 0;
		}
	}

	&.disabled {
		opacity: .5;
	}
}
</style>