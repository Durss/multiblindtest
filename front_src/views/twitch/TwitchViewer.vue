<template>
	<div class="twitchviewer">
		<TwitchPlaylists v-if="playlists" />
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

	public get playlists():any { return this.$store.state.twitchPlaylists; }

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