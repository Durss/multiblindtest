<template>
	<div :class="classes">
		<form @submit.prevent="onSubmitGuess($event)" class="form" v-if="canGuess" @keyup="onKeyUp">
			<label for="trackName" class="label">{{$t('game.guess')}}</label>
			<div class="line" ref="inputLine">
				<Button type="button" :icon="require('@/assets/icons/chat'+(anonMode? '_off' :'')+'.svg')" class="chat" @click="anonMode=!anonMode" :data-tooltip="$t('game.answerForm.chat')" v-if="multiplayerMode" />

				<input ref="input" type="text" :placeholder="$t('game.guessPlaceholder')"
					v-model="guess"
					class="input dark"
					id="trackName"
					autocomplete="off"
					v-focus
					maxlength="100"
				>

				<Button type="submit" :icon="require('@/assets/icons/checkmark_white.svg')" :disabled="guess.length == 0" class="submit" />
			</div>

			<div ref="stars" class="stars">
				<img src="@/assets/icons/star.svg" alt="star" ref="star" v-for="i in 1" :key="i">
			</div>
		</form>
		
		<div v-if="shareUrl" class="shareUrl" ref="share">
			<Button :icon="require('@/assets/icons/cross_white.svg')" class="close" @click="$emit('closeShare')" />
			<p class="title">{{$t('group.lobby.share.copied')}}</p>
			<input type="text" v-model="shareUrl" class="dark" @focus="$event.target.select()">
		</div>
		
		<div class="actions" v-if="!multiplayerMode">
			<Button @click="onShowAnswers()" class="showAnswers" :icon="require('@/assets/icons/show.svg')" :data-tooltip="$t('game.answerForm.show')" big v-if="canGuess" />
			<Button @click="onShareList()" class="showAnswers" :icon="require('@/assets/icons/share.svg')" :data-tooltip="$t('game.answerForm.share')" big v-if="showShare" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from './Button.vue';
import gsap from 'gsap';

@Component({
	components:{
		Button,
	}
})
export default class TrackAnswerForm extends Vue {

	@Prop({default:true})
	public canGuess:boolean;

	@Prop({default:true})
	public showShare:boolean;

	@Prop({default:true})
	public multiplayerMode:boolean;

	@Prop()
	public shareUrl:string;

	public guess:string = "";
	public error:boolean = false;
	public success:boolean = false;
	public anonMode:boolean = false;
	public focusHandler:any;

	public get classes():string[] {
		let res = ["trackanswerform"]
		if(this.error) res.push("error");
		if(this.success) res.push("success");
		return res;
	}

	public mounted():void {
		this.focusHandler = (e)=>this.onFocus();
		document.addEventListener("keydown", this.focusHandler);
		document.addEventListener("mouseup", this.focusHandler);
	}

	public beforeDestroy():void {
		document.removeEventListener("keydown", this.focusHandler);
		document.removeEventListener("mouseup", this.focusHandler);
	}

	private onFocus():void {
		if(!this.$refs.input) return;
		(<HTMLInputElement>this.$refs.input).focus();
	}

	public shake():void {
		this.error = true;
		gsap.killTweensOf(this.$refs.inputLine);
		gsap.set(this.$refs.inputLine, {left:0});
		gsap.to(this.$refs.inputLine, {duration:.05, left:"-10px", repeat:5, ease:"Sine.easeInOut", onComplete:()=> {
				this.error = false
		}}).yoyo(true);
	}

	public shine():void {
		this.guess = "";
		// gsap.set(this.$refs.input, {filter:"brightness(1)"});
		// gsap.from(this.$refs.input, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
		this.burstParticles();
		this.success = true;
		gsap.to(this.$refs.inputLine, {duration:.1, scale:"1.025", repeat:1, ease:"Sine.easeInOut", onComplete:()=> {
			this.success = false;
		}}).yoyo(true);
	}

	public onSubmitGuess(event):void {
		this.$emit("guess", this.guess);
		if(!this.anonMode) {
			this.sendChatMessage();
		}
	}

	public onKeyUp(event:KeyboardEvent):void {
		//Manage ctrl+Enter to submit chat message
		if(event.keyCode == 13 && event.ctrlKey && this.guess.length > 0) {
			this.sendChatMessage();
		}
		//Escape key
		if(event.keyCode == 27) {
			this.guess = "";
		}
	}

	public sendChatMessage():void {
		this.$emit("sendToChat", this.guess);
		this.guess = "";
	}

	public onShowAnswers():void {
		this.$emit("showAnswers");
	}

	public onShareList():void {
		this.$emit("share");
		this.$nextTick().then(_=> {
			gsap.set(this.$refs.share, {filter:"brightness(1)"});
			gsap.from(this.$refs.share, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
		})
	}

	public burstParticles():void {
		let stars = <Element[]>this.$refs.star;
		for (let i = 0; i < stars.length; i++) {
			const s = stars[i];
			gsap.killTweensOf(s);
			let px = Math.random() * 400
			let py = Math.random() * 40 - 40;
			gsap.set(s, {opacity:1, x:px, y:py, scale:Math.random()*.5 + .5});
			gsap.to(s, {opacity:0, x:px + (Math.random()-Math.random()) * 100, y:py + (Math.random()-Math.random()) * 100, scale:0, duration:1.25});
		}
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
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
		.input {
			background-color: #fff;
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
				&:focus, &:focus{
					outline: none;
				}
			}
			.submit {
				flex-grow: 0;
				width: 40px;
				height: 40px;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
				::v-deep {
					img {
						width: 100%;
						min-width: 20px;
					}
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
				::v-deep {
					img {
						width: 100%;
						min-width: 20px;
					}
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