<template>
	<component
	:class="classes"
	:is="nodeType"
	:type="type=='checkbox'? null : type"
	:target="target"
	:to="to"
	:data-selected="selected"
	@click="onClick()"
	:style="progressStyle">
		<img :src="parsedIcon" v-if="parsedIcon" alt="icon" class="icon" :class="loading? 'hide' : 'show'">
		<!--
			<img v-if="loading &&  white !== false" src="@/assets/loader/loader_light.svg" alt="icon" class="spinner">
			<img v-if="loading && white === false" src="@/assets/loader/loader_white.svg" alt="icon" class="spinner">
		-->
		<img v-if="loading" src="@/assets/loader/loader_white.svg" alt="icon" class="spinner">
		<span class="label" :class="loading? 'hide' : 'show'" v-if="title" v-html="title"></span>
		<input :id="id" type="file" v-if="type=='file'" class="browse" accept=".zip" ref="browse" @change="$emit('change', $event)" />
		<input :id="id" type="checkbox" :name="name" class="checkbox" ref="checkbox" v-model="checked" v-if="type=='checkbox'" />
	</component>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import gsap from 'gsap';

@Component
export default class Button extends Vue {

	@Prop()
	public id!:string;
	@Prop()
	public icon!:string;
	@Prop()
	public iconSelected!:string;
	@Prop()
	public title!:string;
	@Prop()
	public name!:string;
	@Prop({default: false})
	public loading!:boolean;
	@Prop({default: "button"})
	public type!:string;
	@Prop()
	public target!:string;
	@Prop({default: null})
	public to!:any;
	@Prop({default: -1})
	public percent!:number;
	@Prop({default:false})
	public white!:boolean;
	@Prop({default:false})
	public big!:boolean;
	@Prop({default:false})
	public highlight!:boolean;
	@Prop({default:false})
	public selected!:boolean;
	@Prop({default:false})
	public disabled!:boolean;
	@Prop({default:false})
	public value!:boolean;

	private iconClass:string = "";
	public pInterpolated:number = -1;
	public checked:boolean = false;

	public get nodeType():string {
		if(this.to) return "router-link";
		if(this.type == "checkbox") return "div";
		return "button";
	}

	public get parsedIcon():string {
		if(this.type == "checkbox" && this.value) {
			return require("@/assets/icons/checkmark.svg");
		}
		if(this.selected !== false && this.iconSelected) {
			return this.iconSelected;
		}else{
			return this.icon;
		}
	}

	public get progressStyle():any {
		if(this.pInterpolated> -1 && this.pInterpolated<100) {
			let p:number = Math.round(this.pInterpolated);
			let color = "255, 255, 255";
			let alpha = .5;
			if(this.white) {
				color = "75, 201, 194"
				alpha = .3;
			}
			return {backgroundImage: "linear-gradient(to right, rgba("+color+",0) "+p+"%,rgba("+color+",0) "+p+"%,rgba("+color+","+alpha+") "+p+"%,rgba("+color+","+alpha+") 100%)"};
		}else{
			return {};
		}
	}

	public get classes():any {
		let list =  ["button"]
		if(!this.title) list.push("noTitle");
		if(this.white !== false) list.push("white");
		if(this.big !== false) list.push("big");
		if(this.highlight !== false) list.push("highlight");
		if(this.selected !== false) list.push("selected");
		if(this.loading !== false) list.push("disabled");
		if(this.disabled !== false) list.push("disabled");
		if(this.type == "checkbox") list.push("checkbox");
		return list;
	}

	public mounted():void {
		this.checked = this.value;
	}
	
	public beforeDestroy():void {
		
	}

	public resetBrowse():void {
		(<HTMLFormElement>this.$refs.browse).value = null;
	}

	public onClick():void {
		this.$emit('click');//bubble up event to avoid having to listen for @click.native everytime
	}


	@Watch("checked")
	public onSelectStateChange():void {
		this.$emit('input', this.checked);
	}

	@Watch("percent")
	private onPercentChange():void {
		let duration = this.percent < this.pInterpolated? 0 : .35;
		gsap.killTweensOf(this);
		gsap.to(this, {duration, pInterpolated:this.percent, ease:"sine.inout"});
	}

}
</script>

<style lang="less" scoped>
@import (reference) '../less/_includes.less';
.button {
	position: relative;//Necessary for loader spinning absolute placement
	display: inline-flex;
	// width: 100%;
	// height: 100%;
	justify-content: center;
	align-items: center;
	flex-direction: row;
	white-space: nowrap;
	transition: all .25s;
	overflow: hidden;

	&.noTitle {
		margin: 0;
		padding: 7px;
		.icon {
			height: 100%;
			max-height: 26px;
			margin: 0;
			padding: 0;
		}

		&.big {
			padding: 19px;
			.icon {
				min-width: 40px;
				max-height: 40px;
			}
		}
	}

	&.checkbox {
		background: none;
		border: 1px solid @mainColor_normal;
		border-radius: 7px;
		padding: 0px;
		width: 25px;
		height: 25px;
		cursor: pointer;

		.checkbox {
			opacity: .001;
			position: absolute;
			padding: 0;
			margin: 0;
			width: 100%;
			height: 100%;
			cursor: pointer;
		}
		.icon {
			width: 70%;
		}
		&:hover {
			background-color: @mainColor_normal_extralight;
		}
	}

	.icon {
		// max-height: 20px;
		width: 20px;
		margin-right: 10px;
		vertical-align: middle;
	}

	.spinner {
		.center;
		position: absolute;
		vertical-align: middle;
		height: 25px;
		width: 25px;
	}

	.label {
		flex-grow: 1;
		white-space: nowrap;
	}

	.label, .icon {
		opacity: 1;
		transition: opacity .2s;
		&.hide {
			opacity: .25;
		}
	}

	.browse {
		opacity: 0;
		position: absolute;
		z-index: 0;
		left: 0;
		width: 100%;
		height: 200%;//Hack to avoid browse button from locking cursor:pointer by putting it out of button's bounds
		cursor: pointer;
		font-size: 0px;
	}

	&.white {
		color: @mainColor_normal;
		background-color: #fff;
		.label, .icon {
			&.hide {
				opacity: .4;
			}
		}
		&:not(.loading):hover {
			background-color: @mainColor_light_extralight;
		}
		&.loading {
			background-color: fade(#ffffff, 50%);
		}
	}

	&.big {
		padding: 20px;
		border-radius: 50px;
		.label {
			font-size: 30px;
		}
		.icon {
			min-width: 30px;
			min-height: 30px;
		}
	}

	&.highlight {
		background-color: @mainColor_warn;
		.label, .icon {
			&.hide {
				opacity: .4;
			}
		}
		&:not(.loading):hover {
			background-color: @mainColor_warn_light;
		}
		&.loading {
			background-color: fade(@mainColor_warn, 50%);
		}
		&.selected {
			background-color: @mainColor_warn_extralight;
		}
	}

	&.selected:not(.highlight) {
		background-color: @mainColor_highlight;
		color: #fff;
		&:hover {
			background-color: fade(@mainColor_normal_light, 50%);
		}
	}
	&.small {
		padding: 5px 10px;
		border-radius: 7px;
		font-size: 14px;
		text-transform: none;
	}
	
	&.disabled {
		opacity: .35;
		color: rgba(255,255,255,.5);
		.icon {
			opacity: .35;
		}
	}
	
	&.cancel {
		background-color: #ccc;
		&:hover {
			background-color: #ddd;
		}
	}
}

@media only screen and (max-width: 500px) {
	.button {
		&.noTitle.big, &.big {
			padding: 12px;
			border-radius: 50px;
			.label {
				font-size: 25px;
			}
			.icon {
				min-width: 25px;
				min-height: 25px;
			}
		}
	}
}
</style>