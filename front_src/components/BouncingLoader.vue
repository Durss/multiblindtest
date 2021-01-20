<template>
	<div class="bouncingloader">
		<img src="@/assets/loader/loader.svg" class="loader">
		<img :src="icon" class="icon" ref="icon">
		<div class="title">
			<span v-if="label">{{label}}</span>
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
import gsap from "gsap";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class BouncingLoader extends Vue {

	@Prop()
	public icon:string;

	@Prop()
	public label:string;

	public mounted():void {
		gsap.to(this.$refs.icon, {duration: 1, ease:"Elastic.easeIn", scale:1.2, repeat:100}).yoyo(true);
	}

	public beforeDestroy():void {
		gsap.killTweensOf(this.$refs.icon);
	}

}
</script>

<style scoped lang="less">
.bouncingloader{
	margin: auto;
	position: relative;

	.title {
		position: relative;
		font-size: 20px;
		padding-top: 110px;
		text-align: center;
		width: 100%;
	}

	.loader {
		position: absolute;
		width: 100px;
		height: 100px;
		left: 50%;
		transform: translate(-50%, 0);
	}

	.icon {
		position: absolute;
		width: 40px;
		top: 30px;
		left: 50%;
		transform: translate(-50%, 0);
	}
}
</style>