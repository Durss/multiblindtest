<template>
	<div class="countdown">
		<div v-for="index in seconds" :key="index" ref="number" class="number">{{(seconds - index==0)? "GO" : seconds - index}}</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import gsap from 'gsap';
import Beeper from '../utils/Beeper';

@Component({
	components:{}
})
export default class CountDown extends Vue {

	public seconds:number = 4;
	public timeout:number;

	public mounted():void {
		let nbrs = <HTMLDivElement[]>this.$refs.number;
		for (let i = 0; i < nbrs.length; i++) {
			const element = nbrs[i];
			gsap.set(nbrs[i], {scale:0, opacity:0});
			gsap.to(nbrs[i], {duration: .1, scale:1, opacity:1, delay:i});
			gsap.to(nbrs[i], {duration: .1, scale:.5, opacity:0, delay:i+.9});
		}
		Beeper.instance.beepPatern([{d:100, f:800, p:900},{d:100, f:800, p:900},{d:100, f:800, p:900},{d:300, f:1600}], .2);
		clearTimeout(this.timeout);
		this.timeout = setTimeout(_=> {
			this.$emit("complete")
		}, this.seconds * 1000-500)
	}

	public beforeDestroy():void {
		clearTimeout(this.timeout);
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.countdown{
	pointer-events: none;
	.number {
		font-size: 50vh;
		font-family: "FuturaExtraBold";
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		color: #fff;
		text-shadow: rgba(0,0,0,.25) 2px 2px 4px;
	}
}
</style>