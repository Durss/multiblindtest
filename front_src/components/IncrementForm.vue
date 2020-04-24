<template>
	<div class="incrementform">
		<label class="title" :for="inputId">{{title}}</label>
		<div class="content">
			<Button :icon="require('@/assets/icons/minus.svg')" @click="valueLocal--;" class="button" />
			<input type="number" v-model="valueLocal" min="1" :max="maxValue" class="dark" :id="inputId">
			<Button :icon="require('@/assets/icons/plus.svg')" @click="valueLocal++;" class="button" />
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
export default class IncrementForm extends Vue {

	@Prop()
	public title:string;

	@Prop()
	public value:number;

	@Prop({default:30})
	public maxValue:number;
	
	public inputId:string = "incrementInput_"+Math.round(Math.random() * 999999);
	public valueLocal:number = 0;

	public mounted():void {
		this.valueLocal = this.value;
	}

	public beforeDestroy():void {
		
	}

	@Watch("valueLocal")
	private changeCount():void {
		this.valueLocal = Math.max(1, Math.min(this.maxValue, this.valueLocal));
		this.$emit("input", this.valueLocal);
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.incrementform{
	.title {
		white-space: nowrap;
		font-size: 18px;
		display: block;
	}
	.content {
		display: flex;
		flex-direction: row;
		justify-content: center;
		color: @mainColor_dark;
		// .blockContent();
		.count {
			border: 1px solid @mainColor_normal;
			font-weight: bold;
			border-radius: 10px;
			padding: 7px;
			margin: 0 10px;
		}
		input{
			width: 35px;
			padding: 0;
			text-align: center;
			margin: 0 10px;
			//Disable up/down arrows
			&::-webkit-inner-spin-button, 
			&::-webkit-outer-spin-button { 
				appearance: none;
				margin: 0; 
			}
		}
		.button {
			width: 25px;
			height: 25px;
			padding: 0;
			::v-deep img {
				width: auto;
				max-height: 60%;
				max-width: 90%;
			}
		}
	}
}
</style>