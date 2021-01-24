<template>
	<div class="twitchbroadcaster">
		<img src="@/assets/icons/home_logo.svg" class="icon">
		<div>Open the MultiBlindtest website and create a twitch game session to start it here.</div>
		<Button class="button" type="link"
		title="Open MultiBlindtest"
		:to="'https://multiblindtest.com'+url"
		:icon="require('@/assets/icons/ext_link.svg')"
		target="_blank" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class TwitchBroadcaster extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.twitchbroadcaster{
	text-align: center;
	.icon {
		height: 150px;
		margin-bottom: 20px;
	}
	.button {
		margin-top: 20px;
	}
}
</style>