<template>
	<div :class="classes">
		<div class="loader">
			<svg class="bg" :style="bgLoaderStyle" viewBox="0 0 247.1 150.9">
				<path class="st0" d="M247.1,150.9c-23.4-4.9-32.2-35.5-36.6-64l0,0c0-48-38.9-86.9-86.9-86.9S36.6,38.9,36.6,86.9l0,0 c-4.3,28.5-8.6,58.9-36.6,64H247.1z"/>
			</svg>
			<img src="@/assets/loader/loader_white.svg" alt="loader" class="spinner">
		</div>
		<span v-html="label" class="label" :style="labelStyle"></span>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Utils from '../utils/Utils';

@Component({
	components:{}
})
export default class SimpleLoader extends Vue {

	@Prop({default:"Loading..."})
	public label:string;

	@Prop()
	public theme:string;

	@Prop({default:false})
	public big:boolean;

	public localColor:string = null;

	public get classes():string[] {
		let res = ["SimpleLoader"];
		if(this.big !== false) res.push("big");
		return res;
	}

	public get bgLoaderStyle():any {
		return {
			fill:this.localColor,
		}
	}

	public get labelStyle():any {
		return {
			backgroundColor:this.localColor,
		}
	}

	public mounted():void {
		if(!this.theme) {
			this.localColor = Utils.getLessVars().mainColor_warn;
		}else{
			this.localColor = Utils.getLessVars()[this.theme];
		}
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.SimpleLoader{
	display: flex;
	flex-direction: column;
	align-items: center;

	span {
		font-style: italic;
		color: #fff;
		text-align: center;
		flex-grow: 1;
		border-radius: 50px;
		padding: 10px;
	}

	.loader {
		position: relative;
		width: 60px;
		height: 36px;

		.spinner {
			position: absolute;
			width: 20px;
			height: 20px;
			top: 0;
			left: 0;
			padding: 10px 20px;
		}
	}

	&.big {
		span {
			font-size: 35px;
			padding: 15px 25px;
		}

		.loader {
			width: 90px;
			height: 53px;

			.spinner {
				width: 40px;
				height: 40px;
				padding: 10px 25px;
			}
		}
	}
}
</style>