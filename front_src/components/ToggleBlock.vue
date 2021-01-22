<template>
	<div :class="classes">
		<h2 @click="showContent = !showContent">{{(showContent? "×":"+")}} {{title}}</h2>
		<div class="content" v-if="showContent">
			<slot :close="close"></slot>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class ToggleBlock extends Vue {

	@Prop()
	public title:string;

	@Prop({default:null})
	public closed:boolean;

	@Prop({default:false})
	public small:boolean;

	public showContent:boolean = true;

	public get classes():string[] {
		let res = ["toggleblock"];
		if(this.showContent) res.push("open");
		if(this.small !== false) res.push("small");
		return res;
	}

	public mounted():void {
		this.showContent = this.closed == null;
	}

	public beforeDestroy():void {
		
	}

	public open():void {
		this.showContent = true;
	}

	public close():void {
		this.showContent = false;
	}

}
</script>

<style scoped lang="less">
.toggleblock{
	h2 {
		margin-bottom: 0px;
		cursor:pointer;
		transition: background-color .25s;
		border-radius: 20px;
		&:hover {
			background-color: darken(@mainColor_light, 2%);
		}
	}

	.content {
		background-color: #ffffff;
		max-width: 480px;
		margin: auto;
		padding: 10px;
		box-sizing: border-box;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
	}

	&.open {
		h2 {
			margin-bottom: 0px;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}
	}

	&.small {
		h2 {
			padding: 0 0 5px 0;
			margin: 0;
			border-radius: 10px;
			margin-bottom: 10px;
		}

		&.open {
			h2 {
				margin-bottom: 0;
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
			}
		}

		.content {
			padding: 0;
		}
	}
}
</style>