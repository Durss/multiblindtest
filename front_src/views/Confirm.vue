<template>
	<div :class="(hidden? 'hidden ' : '') + 'confirmView'">
		<div class="dimmer" ref="dimmer" @click="answer(false)"></div>
		<div class="holder" ref="holder">
			<div class="title" v-html="title"></div>
			<div class="description" v-html="description"></div>
			<div class="buttons">
				<Button class="cancel" type="cancel" @click="answer()" :title="$t('global.no')" />
				<Button class="confirm" @click="answer(true)" :title="$t('global.yes')" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from 'vue-property-decorator';
import gsap from 'gsap';
import Button from '@/components/Button.vue';

@Component({
	components:{
		Button
	}
})
export default class ConfirmView extends Vue {
	public title:string = "";
	public description:string = "";
	public hidden:boolean = true;

	public mounted():void {
		document.addEventListener("keydown", (e:KeyboardEvent) => this.onKeyDown(e))
	}

	@Watch('$store.state.confirm', { immediate: true, deep: true })
	private onConfirmChanged() {
		let hidden = !this.$store.state.confirm || !this.$store.state.confirm.title;
		
		if(this.hidden == hidden) return;//No change, ignore

		if(!hidden) {
			this.hidden = hidden;
			this.title = this.$store.state.confirm.title;
			this.description = this.$store.state.confirm.description;
			//@ts-ignore
			document.activeElement.blur();//avoid clicking again on focused button if submitting confirm via SPACE key
			gsap.killTweensOf([this.$refs.holder, this.$refs.dimmer]);
			gsap.set(this.$refs.holder, {marginTop:0, opacity:1});
			gsap.to(this.$refs.dimmer, {duration:.25, opacity:1});
			gsap.from(this.$refs.holder, {duration:.25, marginTop:100, opacity:0, ease:"back.out"});
		}else{
			gsap.killTweensOf([this.$refs.holder, this.$refs.dimmer]);
			gsap.to(this.$refs.dimmer, {duration:.25, opacity:0});
			gsap.to(this.$refs.holder, {duration:.25, marginTop:100, opacity:0, ease:"back.out", onComplete:()=> {
				this.hidden = true;
			}});
		}
	}

	private onKeyDown(e:KeyboardEvent):void {
		if(this.hidden) return;
		if(e.keyCode == 13 || e.keyCode == 32) {//Enter / space
			this.answer(true);
			e.preventDefault();
			e.stopPropagation();
		}
		if(e.keyCode == 27) {//escape
			this.answer(false);
			e.preventDefault();
			e.stopPropagation();
		}
	}

	private answer(confirm:boolean):void {
		if(!this.$store.state.confirm) return;
		
		if(confirm) {
			if(this.$store.state.confirm.confirmCallback) {
				this.$store.state.confirm.confirmCallback();
			}
		}else{
			if(this.$store.state.confirm.cancelCallback) {
				this.$store.state.confirm.cancelCallback();
			}
		}
		this.$store.state.confirm = null;
	}
}
</script>

<style lang="less" scoped>
.confirmView {
	z-index: 99;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	&.hidden {
		display: none;
	}
	.dimmer {
		position: absolute;
		top: 0;
		left: 0;
		background-color: rgba(0,0,0,.5);
		width: 100%;
		height: 100%;
	}

	.holder {
		.center();
		position: absolute;
		background-color: #fff;
		padding: 30px;
		width: 400px;
		box-sizing: border-box;
		border-radius: 20px;

		.title {
			font-size: 25px;
			font-weight: bold;
			text-align: center;
			font-family: "Futura";
		}

		.description {
			margin-top: 20px;
			font-family: "FuturaLight";
		}

		.buttons {
			display: flex;
			flex-direction: row;
			max-width: 220px;
			margin: auto;
			margin-top: 30px;
			justify-content: space-between;

			button {
				width: 100px;
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.confirm {
		.holder {
			padding: 15px;
			width: 90vw;

			.title {
				font-size: 22px;
			}

			.buttons {
				margin-top: 15px;
				button {
					font-size: 18px;
					padding: 10px;
				}
			}
		}
	}
}

@media only screen and (max-width: 360px) {
	.confirm {
		.holder {
			padding: 15px;
			width: 90vw;

			.title {
				font-size: 20px;
			}

			.buttons {
				margin-top: 15px;
				button {
					font-size: 15px;
					padding: 10px;
				}
			}
		}
	}
}
</style>

<style lang="less">

.confirm {

	.holder {
		.description {
			strong {
				color: @mainColor_warn;
				font-weight: bold;
			}
		}
	}
}
</style>