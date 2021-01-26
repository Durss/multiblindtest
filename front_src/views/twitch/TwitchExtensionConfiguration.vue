<template>
	<div class="twitchextensionconfiguration">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>No configuration needed</h1>
		<div>Just head over multiblindtest.com and start a game session from it:</div>
		<Button type="link" target="_blank" to="https://multiblindtest.com" :icon="require('@/assets/icons/ext_link.svg')" title="Open Multiblindtest" />
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
	}
})
export default class TwitchExtensionConfiguration extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.twitchextensionconfiguration{
	text-align: center;
	*> {
		margin-bottom: 10px;
	}
	.logo {
		width: 150px;
	}
}
</style>