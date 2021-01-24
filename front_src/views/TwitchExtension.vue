<template>
	<div class="twitchvideooverlay">
		<div class="frameholder">
			<BouncingLoader class="loader" :icon="require('@/assets/icons/home_logo.svg')" v-if="!ready" />
			<router-view name="twitch" class="subView"></router-view>
		</div>
	</div>
</template>

<script lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import Api from "@/utils/Api";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{
		Button,
		BouncingLoader,
	}
})
export default class TwitchVideoOverlay extends Vue {

	public isBroadcaster:boolean = false;
	public ready:boolean = false;

	public get url():string {
		return this.$router.resolve({name:"twitch/auth"}).href;
	}

	public async mounted():Promise<void> {
		this.$store.dispatch("setHideBackground", true);
		
		if(TwitchExtensionHelper.instance.connected) {
			this.onConnected();
		}else{
			await TwitchExtensionHelper.instance.onConnect();
			this.onConnected();
		}
	}

	public beforeDestroy():void {
		
	}

	private onConnected():void {
		this.ready = true;
		
		if(this.$route.name != "twitchext") return;

		if(TwitchExtensionHelper.instance.isBroadcaster) {
			this.$router.push({name:"twitchext/broadcaster"});
		}else{
			this.$router.push({name:"twitchext/viewer"});
		}
	}

}
</script>

<style scoped lang="less">
.twitchvideooverlay{
	&>.frameholder {
		position: absolute;
		top: 5rem;
		bottom: 5rem;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
	}

	.loader {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		/deep/ .icon {
			top: 12px;
			width: 70px;
			height: 70px;
		}
	}
}
</style>