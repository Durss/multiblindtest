<template>
	<div class="countdown">
		<div v-for="index in delay" :key="index" ref="number" class="number">{{(delay - index==0)? "GO" : delay - index}}</div>
	</div>
</template>

<script lang="ts">
import gsap from 'gsap';
import { Component, Prop, Vue } from "vue-property-decorator";
import Beeper from '../utils/Beeper';

@Component({
	components:{}
})
export default class CountDown extends Vue {

	@Prop({default:4})
	public seconds:number;

	@Prop({default:0})
	public additionalTime:number;

	public timeout1:number;
	public timeout2:number;
	public timeoutBeeps:number;

	public get delay():number {
		return this.seconds + this.additionalTime;
	}

	public mounted():void {
		let nbrs = <HTMLDivElement[]>this.$refs.number;
		if(!nbrs) return;

		for (let i = 0; i < nbrs.length; i++) {
			const element = nbrs[i];
			gsap.set(nbrs[i], {scale:0, opacity:0});
			gsap.to(nbrs[i], {duration: .1, scale:1, opacity:1, delay:i});
			gsap.to(nbrs[i], {duration: .1, scale:.5, opacity:0, delay:i+.9});
		}
		let volume = this.$store.state.volume / 2;
		let beeps = [];
		let len = 3;//this.seconds - 1
		for (let i = 0; i < len; i++) {
			beeps.push({d:100, f:800, p:900});
		}
		beeps.push({d:300, f:1600})
		let delay = (this.seconds + this.additionalTime) - 4;
		clearTimeout(this.timeoutBeeps);
		//Start beeps only for last 4 seconds
		this.timeoutBeeps = setTimeout(_=>{
			Beeper.instance.beepPatern(beeps, volume);
		}, delay * 1000);

		clearTimeout(this.timeout1);
		this.timeout1 = setTimeout(_=> {
			this.$emit("complete")
		}, (this.seconds + this.additionalTime) * 1000-500);

		if(this.additionalTime > 0) {
			clearTimeout(this.timeout2);
			this.timeout2 = setTimeout(_=> {
				this.$emit("3SecComplete")
			}, this.seconds * 1000-500);
		}
	}

	public beforeDestroy():void {
		Beeper.instance.stopAll();
		clearTimeout(this.timeout1);
		clearTimeout(this.timeout2);
	}

}
</script>

<style scoped lang="less">
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