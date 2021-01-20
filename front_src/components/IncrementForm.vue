<template>
	<div class="incrementform">
		<label class="title" :for="inputId" v-if="title">{{title}}</label>
		<div class="content" @mousewheel="onMouseWheel">
			<Button :icon="require('@/assets/icons/minus.svg')"
				@mousedown.native="startIncrement(-1);"
				@mouseup.native="stopIncrement($event);"
				@touchstart.native="startIncrement(-1);"
				@touchend.native="stopIncrement($event);"
				class="button"
			/>
			<input type="number" v-model="valueLocal" :min="minValue" :max="maxValue" class="dark" :id="inputId">
			<Button :icon="require('@/assets/icons/plus.svg')"
				@mousedown.native="startIncrement(1);"
				@mouseup.native="stopIncrement($event);"
				@touchstart.native="startIncrement(1);"
				@touchend.native="stopIncrement($event);"
				class="button"
			/>
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

	@Prop({default:1})
	public minValue:number;

	@Prop({default:30})
	public maxValue:number;
	
	public inputId:string = "incrementInput_"+Math.round(Math.random() * 999999);
	public incInterval:number;
	public valueLocal:number = 0;

	public mounted():void {
		this.valueLocal = this.value;
	}

	public beforeDestroy():void {
		
	}

	@Watch("value")
	private changeValue():void {
		this.valueLocal = this.value;
	}

	@Watch("valueLocal")
	private changeCount():void {
		this.valueLocal = Math.max(this.minValue, Math.min(this.maxValue, this.valueLocal));
		this.$emit("input", this.valueLocal);
	}

	private onMouseWheel(e:WheelEvent):void {
		let delta = e.deltaY? e.deltaY : e.deltaX;
		if(delta > 0) this.valueLocal--;
		if(delta < 0) this.valueLocal++;
		e.preventDefault();
	}

	public startIncrement(inc:number):void {
		this.valueLocal += inc;
		clearInterval(this.incInterval);
		this.incInterval = setInterval(_=> { this.valueLocal += inc; }, 100);
	}

	public stopIncrement(e:MouseEvent|TouchEvent):void {
		clearInterval(this.incInterval);
		e.preventDefault();
	}

}
</script>

<style scoped lang="less">
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