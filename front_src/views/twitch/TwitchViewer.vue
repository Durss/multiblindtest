<template>
	<div class="twitchviewer" v-if="playlists">
		<h1>{{$tc('twitch.viewer.selectedPlaylists', playlists.length)}}</h1>
		<div class="playlists">
			<div v-for="p in playlists" :key="p.id" class="playlist">
				<img :src="p.cover" :alt="p.name" class="cover">
				<span class="label">{{p.name}}</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import TwitchExtensionEvent from "@/twitch/TwitchExtensionEvent";
import TwitchExtensionHelper from "@/twitch/TwitchExtensionHelper";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class TwitchViewer extends Vue {

	public playlists:{name:string,cover:string}[] = null;

	private message:string = "";
	private messageHandler:any;

	public mounted():void {
		this.messageHandler = (e:TwitchExtensionEvent) => this.onMessage(e);
		TwitchExtensionHelper.instance.addEventListener(TwitchExtensionEvent.MESSAGE, this.messageHandler)
	}

	public beforeDestroy():void {
		TwitchExtensionHelper.instance.removeEventListener(TwitchExtensionEvent.MESSAGE, this.messageHandler)
	}

	public onMessage(e:TwitchExtensionEvent):void {
		if(typeof e.data != "string") return;

		let p = JSON.parse(e.data).playlists;
		p.forEach(p => { p.id = Math.random()});
		console.log(p);
		this.playlists = p;
	}

}
</script>

<style scoped lang="less">
.twitchviewer{

	h1 {
		margin-bottom: 20px;
	}
	
	.playlists {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		.playlist {
			background-color: @mainColor_normal;
			border-radius: 100px;
			display: flex;
			flex-direction: row;
			align-items: center;
			padding: 5px 20px;
			box-sizing: border-box;
			width: min-content;
			white-space: nowrap;
			max-width: 100%;
			margin-bottom: 5px;
			margin-right: 5px;
			.label {
				color: #fff;
				margin-left: 20px;
				overflow: hidden;
				line-height: 30px;
				text-overflow: ellipsis;
			}
			.cover {
				width: 30px;
				height: 30px;
				border-radius: 10px;
				object-fit: cover;
			}
		}
	}
}
</style>