<template>
	<div :class="classes">
		<form @submit.prevent="onSubmitGuess($event)" class="form" v-if="props.showForm" @keyup="onKeyUp">
			<label for="trackName" class="label">{{t('game.guess')}}</label>
			<div class="line" ref="inputLine">
				<Button type="button" :icon="getIcon('chat' + (anonMode ? '_off' : ''))" class="chat" @click="anonMode=!anonMode" :data-tooltip="t('game.answerForm.chat')" v-if="props.multiplayerMode" />

				<input ref="input" type="text" :placeholder="t('game.guessPlaceholder')"
					v-model="guess"
					class="input dark"
					id="trackName"
					autocomplete="off"
					v-focus
					maxlength="100"
				>

				<Button type="submit" :icon="getIcon('checkmark_white')" :disabled="guess.length == 0" class="submit" />
			</div>

			<div ref="stars" class="stars">
				<img src="@/assets/icons/star.svg" alt="star" ref="star" v-for="i in 30" :key="i">
			</div>
		</form>

		<div v-if="props.shareUrl" class="shareUrl" ref="share">
			<Button :icon="getIcon('cross_white')" class="close" @click="emit('closeshare')" />
			<p class="title">{{t('group.lobby.share.copied')}}</p>
			<input type="text" :value="props.shareUrl" class="dark" @focus="setFocus($event)">
		</div>

		<div class="actions" v-if="!props.multiplayerMode">
			<Button @click="onShowAnswers()" class="showAnswers" :icon="getIcon('show')" :data-tooltip="t('game.answerForm.show')" big v-if="props.showForm" />
			<Button @click="onShareList()" class="showAnswers" :icon="getIcon('share')" :data-tooltip="t('game.answerForm.share')" big v-if="props.showShare" />
		</div>
	</div>
</template>
<script setup lang="ts">
import { getIcon } from '@/utils/Icons';
import gsap from 'gsap';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import Button from './Button.vue';

const props = withDefaults(defineProps<{
	showForm?:boolean;
	canGuess?:boolean;
	showShare?:boolean;
	multiplayerMode?:boolean;
	shareUrl?:string;
}>(), {
	showForm:true,
	canGuess:true,
	showShare:true,
	multiplayerMode:true,
});

const emit = defineEmits<{
	guess:[value:string];
	sendToChat:[value:string];
	showAnswers:[];
	share:[];
	closeshare:[];
}>();

const { t } = useI18n();

const inputLine = useTemplateRef<HTMLDivElement>("inputLine");
const input = useTemplateRef<HTMLInputElement>("input");
const share = useTemplateRef<HTMLDivElement>("share");
const star = useTemplateRef<HTMLImageElement[]>("star");

const guess = ref<string>("");
const error = ref<boolean>(false);
const success = ref<boolean>(false);
const anonMode = ref<boolean>(false);
let focusHandler:any;

const classes = computed(():string[] => {
	let res = ["trackanswerform"]
	if(error.value) res.push("error");
	if(success.value) res.push("success");
	if(props.multiplayerMode) res.push("multiplayermode");
	return res;
});

onMounted(() => {
	focusHandler = (e)=>onFocus();
	document.addEventListener("keydown", focusHandler);
	document.addEventListener("mouseup", focusHandler);
});

onBeforeUnmount(() => {
	document.removeEventListener("keydown", focusHandler);
	document.removeEventListener("mouseup", focusHandler);
});

function onFocus():void {
	if(!input.value) return;
	input.value.focus();
}

function shake():void {
	error.value = true;
	gsap.killTweensOf(inputLine.value);
	gsap.set(inputLine.value, {left:0});
	gsap.to(inputLine.value, {duration:.05, left:"-10px", repeat:5, ease:"Sine.easeInOut", onComplete:()=> {
			error.value = false
	}}).yoyo(true);
}

function shine():void {
	guess.value = "";
	// gsap.set(input.value, {filter:"brightness(1)"});
	// gsap.from(input.value, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
	burstParticles();
	success.value = true;
	gsap.to(inputLine.value, {duration:.1, scale:"1.025", repeat:1, ease:"Sine.easeInOut", onComplete:()=> {
		success.value = false;
	}}).yoyo(true);
}

function onSubmitGuess(event):void {
	if(props.canGuess) {
		emit("guess", guess.value);
	}

	if(!anonMode.value) {
		sendChatMessage();
	}
}

function onKeyUp(event:KeyboardEvent):void {
	//Manage ctrl+Enter to submit chat message
	if(event.keyCode == 13 && event.ctrlKey && guess.value.length > 0) {
		sendChatMessage();
	}
	//Escape key
	if(event.keyCode == 27) {
		guess.value = "";
	}
}

function sendChatMessage():void {
	if(guess.value.trim().length == 0) return;
	emit("sendToChat", guess.value);
	guess.value = "";
}

function onShowAnswers():void {
	emit("showAnswers");
}

function onShareList():void {
	emit("share");
	nextTick().then(_=> {
		gsap.set(share.value, {filter:"brightness(1)"});
		gsap.from(share.value, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
	})
}

function burstParticles():void {
	let stars = star.value;
	for (let i = 0; i < stars.length; i++) {
		const s = stars[i];
		gsap.killTweensOf(s);
		let px = Math.random() * 400 + 40;
		let py = Math.random() * 40 - 40;
		gsap.set(s, {opacity:1, x:px, y:py, scale:Math.random()*1 + .5});
		gsap.to(s, {opacity:0, rotation:(Math.random()-Math.random()) * Math.PI * 2.5+"rad", x:px + (Math.random()-Math.random()) * 200, y:py + (Math.random()-Math.random()) * 100, scale:0, duration:1.25});
	}
}

function setFocus(e:FocusEvent):void {
	(e.target as HTMLInputElement).select();
}

defineExpose({ shake, shine });

</script>

<style scoped lang="less">
.trackanswerform{
	display: flex;
	flex-direction: column;

	&.error {
		.input {
			background-color: @mainColor_warn;
			color: #fff;
		}
	}

	&.success {
		.form {
			.line {
				.input {
			background-color: #fff;
				}
			}
		}
	}

	&:not(.multiplayermode) {
		.form {
			.line {
				.input {
					border-top-left-radius: 20px;
					border-bottom-left-radius: 20px;
				}
			}
		}
	}

	.form {
		position: relative;
		.line {
			display: flex;
			flex-direction: row;
			position: relative;
			.input {
				position: relative;
				transition: background-color .25s, color .25s;
				flex-grow: 1;
				border-radius: 0;
				border-right-color: transparent;
				&:focus{
					outline: none;
				}
			}
			.submit {
				flex-grow: 0;
				width: 40px;
				height: 40px;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
				border: 1px solid @mainColor_dark;
				border-left: none;
				:deep(img) {
					width: 100%;
					min-width: 20px;
				}
			}
			.chat {
				min-width: 40px;
				width: 40px;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
				background-color: @mainColor_dark_light;
				border: 1px solid @mainColor_dark;
				border-right: none;
				border-bottom: none;
				:deep(img) {
					width: 100%;
					min-width: 20px;
				}
			}
		}

		.stars {
			position: absolute;
			top:30px;
			pointer-events: none;
			img {
				opacity: 0;
				position: absolute;
				width: 30px;
				height: 30px;
				transform-origin: center center;
			}
		}
	}

	.showAnswers {
		align-self: center;
	}

	.actions {
		margin-top: 30px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		&>*:not(:last-child) {
			margin-right: 10px;
		}
	}

	.shareUrl {
		display: flex;
		flex-direction: column;
		margin-bottom: 20px;
		.title {
			align-self: center;
			margin-bottom: 5px;
		}
		.close {
			align-self: center;
			margin-bottom: 5px;
		}
	}
}
</style>