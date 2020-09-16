<template>
	<div class="slider">
		<div class="label" v-html="label"></div>
		<div class="gauge">
			<div v-for="(i, index) in (max-min+1)" :key="i" :class="classes(index+min)" @click="clicItem(index+min)">{{index+min}}</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class Slider extends Vue {

	@Prop()
	public label:string;
	
	@Prop({default:6})
	public value:number;
	
	@Prop({default:0})
	public min:number;
	
	@Prop({default:10})
	public max:number;

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	public classes(index:number):string[] {
		let res = ["item"];
		if(this.value == index) res.push("selected");
		return res
	}

	public clicItem(index:number):void {
		this.$emit("input", index);
	}

}
</script>

<style scoped lang="less">
.slider{
	.label {
		font-family: "Futura";
		font-weight: bold;
		text-align: center;
		::v-deep {
			i {
				font-family: "FuturaLight";
				font-weight: normal;
				font-size: 16px;
			}
		}
	}
	.gauge {
		display: flex;
		flex-direction: row;
		justify-content: center;
		.item {
			border-radius: 20px;
			flex-grow: 1;
			cursor: pointer;
			border: 1px solid #fff;
			padding: 5px;
			margin: 10px 0px;
			max-width: 40px;

			&.selected {
				background-color: #fff;
				color: @mainColor_warn;
			}
		}
	}
}
</style>