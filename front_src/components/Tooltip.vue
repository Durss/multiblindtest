<template>
  <div class="tooltip">
	  <div class="holder" :class="upsideDown? 'upsideDown' : ''" ref="holder" v-show="opened" key="tooltip">
		  <div ref="content"></div>
		  <div class="tip"></div>
	  </div>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import gsap from 'gsap';

@Component({
	components:{}
})
export default class Tooltip extends Vue {

    public upsideDown:boolean = false;
    private opened:boolean = false;
	
    private currentContent:string;
    private mouseMoveHandler:any;
    private currentTarget:HTMLElement;
    private lastMouseEvent:MouseEvent;

	public mounted():void {
		this.initialize();
	}

	public beforeDestroy():void {
		document.removeEventListener('mousemove', this.mouseMoveHandler);
	}

	@Watch("$store.state.tooltip")
	private tooltipStateChange():void {
		let data = this.$store.state.tooltip;
		if(data) {
			this.show(data);
		}else{
			this.hide();
		}
	}

	/**
	 * Opens the tooltip
	 * @param content
	 */
	public show(content:string):void {
		if(this.$store.state.mobile) return;
		if(this.currentContent == content && this.opened) return;
		this.opened = true;
		this.currentContent = content;
		(<HTMLElement>this.$refs.content).innerHTML = content;
		gsap.killTweensOf(this.$el);
		gsap.to(this.$el, {duration:.2, opacity:1});
		
		if(this.lastMouseEvent) {
			this.$nextTick().then(_=> {
				this.onMouseMove(this.lastMouseEvent, false);
			})
		}
	}

	/**
	 * Hides the tooltip
	 */
	public hide():boolean {
		if(!this.opened) return false;
		this.opened = false;
		gsap.killTweensOf(this.$el);
		gsap.to(this.$el, {duration:.2, opacity:0, onComplete:()=>this.onHideComplete()});
		return true;
	}

    /**
     * Initializes the class
     */
    private initialize():void {
		this.opened = false;

		gsap.set(this.$el, {opacity:0});
		this.mouseMoveHandler = (e:MouseEvent) => this.onMouseMove(e);
		document.addEventListener('mousemove', this.mouseMoveHandler);
	}

	/**
	 * Moves the tooltip
	 * @param e
	 */
	private onMouseMove(e:MouseEvent, checkTarget:boolean = true):void {
		this.lastMouseEvent = e;
		if(checkTarget) {
			let target:HTMLDivElement = <HTMLDivElement>e.target;
			while(target && target != document.body) {
				if(target.dataset && target.dataset.tooltip) break;
				target = <HTMLDivElement>target.parentNode;
			}
			//Target can be null if pressing mouse inside window and moving outside browser while keeping mouse pressed (at least on chrome)
			if(target && target != document.body) {
				this.$store.dispatch("openTooltip", target.dataset.tooltip);
			}else if(this.opened) {
				this.$store.dispatch("closeTooltip");
			}
		}

		if(!this.opened) return;

		let holder = <HTMLDivElement>this.$refs.holder;
		let px:number = (e.clientX - holder.clientWidth * .5);
		let py:number = (e.clientY - holder.clientHeight - 20);
		px = Math.max(0, Math.min(window.innerWidth - holder.clientWidth, px))
		py = Math.max(0, Math.min(window.innerHeight - holder.clientHeight, py))
		if(py < 50) {
			py = e.clientY + 30;
			this.upsideDown = true;
		}else{
			this.upsideDown = false;
		}
		holder.style.left = px+'px';
		holder.style.top = py+'px';

		//Deep check if current hover item is still on DOM
		//Vue can remove/recreate items anytime, in this case
		//"mouseout" event is not fired which blocks the tooltip
		if(this.currentTarget) {
			let t:any = this.currentTarget;
			while(t.parentNode && t.parentNode != document.body){
				t = t.parentNode;
			}
			if(!t || !t.parentNode) {
				this.currentTarget = null;
				this.$store.dispatch("closeTooltip");
			}
		}
	}

	/**
	 * Called when hidding completes
	 */
	private onHideComplete():void {
		this.opened = false;
	}

}
</script>

<style scoped lang="less">
.tooltip{
	position: fixed;
	pointer-events: none;
	z-index: 100;
	.holder {
		position: fixed;
		display: inline;
		color: #fff;
		padding: 8px;
		border-radius: 10px;
		background-color: @mainColor_highlight;
		max-width: 300px;
		text-align: justify;
		font-size: 16px;

		.tip {
			border-left: 10px solid transparent;
			border-right: 10px solid transparent;
			border-top: 12px solid @mainColor_highlight;
			bottom: -12px;
			position: absolute;
			width: 0;
			left:50%;
			transform: translate(-50%, 0);
		}

		&.upsideDown {
			.tip {
				border-left: 10px solid transparent;
				border-right: 10px solid transparent;
				border-top: none;
				border-bottom: 12px solid @mainColor_highlight;
				top: -12px;
				bottom: auto;
				position: absolute;
				width: 0;
				left:50%;
				transform: translate(-50%, 0);
			}
		}
	}
}

//Hide on mobile
@media only screen and (max-width: 500px) {
	.tooltip{
		display: none;
	}
}
</style>