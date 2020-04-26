<template>
	<div :class="classes">
		<form @submit.prevent="onSubmitGuess()" class="form" v-if="canGuess">
			<label for="trackName" class="label">{{$t('game.guess')}}</label>
			<div class="line">
				<input ref="input" type="text" :placeholder="$t('game.guessPlaceholder')"
					v-model="guess"
					class="input dark"
					id="trackName"
					autocomplete="off"
					v-focus
				>
				<Button type="submit" :icon="require('@/assets/icons/checkmark_white.svg')" class="submit" />
			</div>
		</form>
		
		<div v-if="shareUrl" class="shareUrl" ref="share">
			<Button :icon="require('@/assets/icons/cross_white.svg')" class="close" @click="$emit('closeShare')" />
			<p class="title">{{$t('group.lobby.share.copied')}}</p>
			<input type="text" v-model="shareUrl" class="dark" @focus="$event.target.select()">
		</div>
		
		<div class="actions" v-if="showActions">
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
	public showActions:boolean;

	@Prop()
	public shareUrl:string;

	public guess:string = "";
	public error:boolean = false;
	public focusHandler:any;

	public get classes():string[] {
		let res = ["trackanswerform"]
		if(this.error) res.push("error");
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
		gsap.to(this.$refs.input, {duration:.05, left:"-10px", repeat:5, ease:"Sine.easeInOut", onComplete:()=> {
			this.error = false
		}}).yoyo(true);
	}

	public shine():void {
		this.guess = "";
		gsap.set(this.$refs.input, {filter:"brightness(1)"});
		gsap.from(this.$refs.input, {duration:.25, filter:"brightness(2)", ease:"Sine.easeOut"});
	}

	public onSubmitGuess():void {
		this.$emit("guess", this.guess);
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

	.form {
		.line {
			display: flex;
			flex-direction: row;
			.input {
				margin-bottom: 10px;
				position: relative;
				transition: background-color .25s, color .25s;
				flex-grow: 1;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
			.submit {
				flex-grow: 0;
				width: 40px;
				height: 40px;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}

	.showAnswers {
		align-self: center;
	}

	.actions {
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