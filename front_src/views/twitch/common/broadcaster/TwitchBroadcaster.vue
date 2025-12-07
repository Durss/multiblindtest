<template>
	<div class="twitchbroadcaster">
		<img src="@/assets/icons/home_logo_outlined.svg" class="icon">
		<div class="holder">
			<div class="title">Start a game session from multiblindtest.com</div>
			<Button class="button" type="link"
				title="Start Game"
				:to="url"
				:icon="$getIcon('ext_link')"
				target="_blank"
				white />
			<div class="url">{{url}}</div>
		</div>
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
export default class TwitchBroadcaster extends Vue {

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
.twitchbroadcaster{
	text-align: center;
	.icon {
		height: 150px;
		display: block;
		margin: auto;
		margin-bottom: 20px;
	}

	.holder {
		background-color: @mainColor_normal!important;
		padding: 10px;
		border-radius: 7px;
		color: #fff;
		.button {
			margin-top: 20px;
		}
	
		.url {
			font-size: 14px;
			font-style: italic;
			margin: auto;
			margin-top: 10px;
			color: @mainColor_normal;
			background-color: #fff;
			padding: 5px;
			border-radius: 10px;
			white-space: nowrap;
			width: min-content;
		}
	}
}
</style>