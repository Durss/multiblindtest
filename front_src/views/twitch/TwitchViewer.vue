<template>
	<div class="twitchviewer">
		<TwitchPlaylists />
	</div>
</template>

<script lang="ts">
import TwitchPlaylists from "@/components/twitch/TwitchPlaylists.vue";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{
		TwitchPlaylists,
	}
})
export default class TwitchViewer extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
	}

}
</script>

<style scoped lang="less">
.twitchviewer{
}
</style>