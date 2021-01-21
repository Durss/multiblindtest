<template>
	<div :class="classes">
		<canvas ref="canvas"></canvas>
		<div class="time" ref="time" :style="timeStyles">{{textDuration}}</div>
	</div>
</template>

<script lang="ts">
import Utils from "@/utils/Utils";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class TimerRenderer extends Vue {

	@Prop({default:0})
	public percent:number;

	@Prop({default:0})
	public duration:number;

	private cnv:HTMLCanvasElement;
	private ctx:CanvasRenderingContext2D;

	private radius:number = 0;
	private center:{x:number,y:number} = null
	private blink:boolean = false;
	private disposed:boolean = false;
	private lastBlinkTime:number = 0;

	public get classes():string[] {
		let res = ["timerrenderer"];
		if(this.blink) res.push("blink");
		return res;
	}

	public get timeStyles():any {
		let res:any = {};
		
		if(!this.center) return res;

		let a = Math.PI*2 * this.percent;
		let bounds = (<HTMLDivElement>this.$refs.time).getBoundingClientRect();
		let px = this.center.x + Math.cos(a) * (this.radius+30) - bounds.width/2+"px";
		let py = this.center.y + Math.sin(a) * (this.radius+30) - bounds.height/2+"px";
		res.top = 0;
		res.left = 0;
		res.transform = 'translate('+px+', '+py+') translateZ(0)';
		return res;
	}

	public get textDuration():string {
		let d = new Date(Math.ceil(this.duration) * 1000);
		if((
			(d.getTime()/1000 < 20 && d.getSeconds()%5 == 0)
			|| d.getTime()/1000 <= 5
		)
		&& d.getSeconds() != this.lastBlinkTime) {
			this.lastBlinkTime = d.getSeconds();
			this.blink = true;
		}else{
			this.blink = false;
		}
		return Utils.toDigits(d.getMinutes())+":"+Utils.toDigits(d.getSeconds());
	}

	public mounted():void {
		this.cnv = <HTMLCanvasElement>this.$refs.canvas;
		this.ctx = this.cnv.getContext("2d");
		let bounds = this.cnv.getBoundingClientRect();
		this.cnv.width = bounds.width;
		this.cnv.height = bounds.height;
		this.renderFrame();
	}

	public beforeDestroy():void {
		this.disposed = true;
	}

	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(_ => this.renderFrame());

		this.ctx.clearRect(0,0,this.cnv.width,this.cnv.height);

		let thickness = 10;
		this.center = {x:this.cnv.width/2, y:this.cnv.height/2};
		this.radius = Math.min(this.cnv.width, this.cnv.height) / 2 - thickness / 2;

		this.ctx.beginPath();
		this.ctx.strokeStyle = "rgba(255,255,255,.35";
		this.ctx.lineWidth = thickness;
		this.ctx.lineCap = "round";
		this.ctx.arc(this.cnv.width*.5, this.cnv.height*.5,this.radius,0, Math.PI*2);
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.strokeStyle = "#ffffff";
		this.ctx.lineWidth = thickness;
		this.ctx.lineCap = "round";
		this.ctx.arc(this.cnv.width*.5, this.cnv.height*.5,this.radius,0, Math.PI*2*this.percent);
		this.ctx.stroke();
	}

}
</script>

<style scoped lang="less">
.timerrenderer{
	position: relative;
	canvas {
		width: 100%;
		height: 100%;
	}

	&.blink {
		.time {
			background-color: @mainColor_alert;
			transition: background-color 0s;
		}
	}

	.time {
		color: #ffffff;
		background-color: @mainColor_normal;
		border: 5px solid #ffffff;
		padding: 20px;
		border-radius: 50px;
		position: absolute;
		font-family: Futura;
		font-weight: bold;
		font-size: 20px;
		backface-visibility: hidden;
		-webkit-font-smoothing:none;
		transition: background-color 1s;
	}
}
</style>