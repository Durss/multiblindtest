<template>
	<div class="twitchextensionconfiguration">
		<img src="@/assets/icons/home_logo.svg" alt="logo" class="logo">
		<h1>No configuration needed</h1>
		<div>Just head over multiblindtest.com and start a game session from it:</div>
		<Button type="link" target="_blank" :to="url" :icon="require('@/assets/icons/ext_link.svg')" title="Start a game" />
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import Config from "@/utils/Config";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button,
	}
})
export default class TwitchExtensionConfiguration extends Vue {

	public get url():string {
		return Config.BASE_URL+this.$router.resolve({name:"twitch"}).href.replace("#", "");
	}

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