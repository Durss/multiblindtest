<template>
	<div class="democonfig">
		<div class="header">
			<h1>{{$t("demo.title")}}</h1>
			<p>{{$t("demo.description")}}</p>
		</div>

		<div class="content">
			<Button v-for="index in 5" :key="index"
			class="number"
			:icon="require('@/assets/icons/song.svg')"
			:title="'x '+(index+1)"
			:to="{name:'demo/play', params:{trackscounts:index+1}}" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from '../components/Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class DemoConfig extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.democonfig{
	
	.header {
		h1 {
			margin-bottom: 10px;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		.number {
			font-size: 40px;
			margin-bottom: 10px;
			::v-deep .icon {
				width: 40px;
			}
		}
	}
}
</style>