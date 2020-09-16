<template>
	<div :class="classes" @mouseover="isMouseOver = true;" @mouseout="isMouseOver = false;" @touchstart="onTouchStartHolder">
		<img class="icon" v-if="mute" src="@/assets/icons/mute.svg" alt="mute" @click="onClick">
		<img class="icon" v-if="!mute" src="@/assets/icons/unmute.svg" alt="unmute" @click="onClick">
		<div class="percent">{{Math.round(volume*100)}}%</div>
		<div class="content" @mousedown="onPress" @touchstart="onPress">
			<svg viewBox="0 0 20 150" class="bar" ref="arrow">
				<polygon points="10,150 0,0 20,0"/>
			</svg>
			<svg viewBox="0 0 20 150" class="arrow" :style="styles">
				<polygon points="10,150 0,0 20,0"/>
			</svg>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from './Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class VolumeButton extends Vue {

	@Prop({default:.5})
	public value:number;

	public expand:boolean = false;
	public dragging:boolean = false;
	public isMouseOver:boolean = false;
	public prevVolume:number = .5;
	public volume:number = .5;

	private mouseUpHandler:any;
	private mouseMoveHandler:any;

	public get mute():boolean {
		return this.volume == 0;
	}

	public get classes():string[]{
		let res = ["volumebutton"];
		if(this.expand) res.push("expand");
		return res;
	}

	public get styles():any{
		let percent = (1-this.volume) * 100;
		return {
			clipPath: "polygon(0 "+percent+"%, 100% "+percent+"%, 100% 100%, 0 100%)",
		}
	}

	public mounted():void {
		this.volume = this.prevVolume = this.$store.state.volume;

		this.mouseUpHandler = (e) => this.onRelease(e);
		this.mouseMoveHandler = (e) => this.onMove(e);
		document.addEventListener("mouseup", this.mouseUpHandler);
		document.addEventListener("touchend", this.mouseUpHandler);
		document.addEventListener("mousemove", this.mouseMoveHandler);
		document.addEventListener("touchmove", this.mouseMoveHandler);
	}

	public beforeDestroy():void {
		document.removeEventListener("mouseup", this.mouseUpHandler);
		document.removeEventListener("touchend", this.mouseUpHandler);
		document.removeEventListener("mousemove", this.mouseMoveHandler);
		document.removeEventListener("touchmove", this.mouseMoveHandler);
	}

	private toggleSound():void {
		
	}

	public onTouchStartHolder(e:TouchEvent):void {
		if(!this.isMouseOver) {
			e.preventDefault();
		}
		this.isMouseOver = true;
	}

	public onClick():void {
		if(this.volume > 0) this.prevVolume = this.volume;
		if(this.expand) {
			this.volume = this.volume > 0? 0 : this.prevVolume == 0? .5 : this.prevVolume;
		}
	}

	public onPress(e:MouseEvent):void {
		this.dragging = true;
		this.onMove(e);
	}

	public onRelease(e:MouseEvent):void {
		this.dragging = false;
		if(!this.isMouseOver) this.expand = false;
	}

	public onMove(e:MouseEvent|TouchEvent):void {
		if(!this.dragging) return;
		let arrow = <SVGElement>this.$refs.arrow;
		let bounds = arrow.getBoundingClientRect();
		let mouseY = e instanceof MouseEvent? (<MouseEvent>e).clientY : (<TouchEvent>e).touches[0].clientY;
		this.volume = Math.min(1, Math.max(0, 1-(mouseY - bounds.top)/bounds.height));
	}

	@Watch("isMouseOver")
	private onMouseOverChange():void {
		if(!this.isMouseOver && !this.dragging) this.expand = false;
		if(this.isMouseOver) this.expand = true;
	}

	@Watch("volume")
	private onVolumeChange():void {
		this.$store.dispatch("setVolume", this.volume);
	}

}
</script>

<style scoped lang="less">
.volumebutton{
	position: fixed;
	top: 0;
	right: 0;
	background-color: @mainColor_normal;
	border-bottom-left-radius: 40px;
	overflow: hidden;
	transition: height .25s;
	height: 78px;
	width: 78px;
	user-select: none;

	&.expand {
		height: 270px;
		.percent, .content {
			opacity: 1;
		}
	}

	.icon {
		width:40px;
		height:40px;
		padding: 20px;
		padding-bottom: 5px;
		cursor: pointer;
	}

	.percent {
		text-align: center;
		color: #fff;
		margin-bottom: 5px;
		opacity: 0;
		transition: opacity .25s;
	}

	.content {
		position: relative;
		margin: auto;
		display: block;
		width: 60px;
		height: 150px;
		opacity: 0;
		transition: opacity .25s;

		.bar, .arrow {
			width: 100%;
			height: 100%;
			fill: rgba(255, 255, 225, .5);
			cursor: pointer;
			&.arrow {
				position: absolute;
				top: 0;
				left: 0;
				fill: #fff;
				clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
			}
		}
	}
}

@media only screen and (max-width: 500px) {
	.volumebutton{
		width: 49px;
		height: 49px;
		border-bottom-left-radius: 25px;

		&.expand {
			height: 245px;
		}

		.percent {
			font-size: 16px;
		}

		.icon {
			width:25px;
			height:25px;
			padding: 13px;
		}
	}
}
</style>