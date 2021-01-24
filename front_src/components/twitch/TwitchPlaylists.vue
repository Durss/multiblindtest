<template>
	<div class="twitchplaylists">
		<transition name="fadeIn">
			<h1 v-if="playlists.length > 0">{{$tc('twitch.viewer.selectedPlaylists', playlists.length)}}</h1>
		</transition>
		<transition-group tag="div" class="playlists"
		v-bind:css="false"
		v-on:before-enter="beforeEnter"
		v-on:enter="enter"
		v-on:leave="leave">
			<div v-for="(p,index) in playlists" :key="p.id" class="playlist" :data-index="index">
				<img :src="p.cover" :alt="p.name" class="cover">
				<span class="label">{{p.name}}</span>
			</div>
		</transition-group>
	</div>
</template>

<script lang="ts">
import gsap from "gsap";
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{}
})
export default class TwitchPlaylists extends Vue {

	public get playlists():{name:string,cover:string}[] {
		let list:any[] = JSON.parse(JSON.stringify(this.$store.state.twitchPlaylists));
		if(!list) return [];
		list.forEach(v=>v.id = Math.random());
		return list;
	}

	public mounted():void {
		}

	public beforeDestroy():void {
		}

	public beforeEnter(el:HTMLDivElement):void {
		gsap.set(el, {opacity:1});
	}

	public enter(el:HTMLDivElement):void {
		let index = parseInt(el.dataset.index) + 1;
		gsap.from(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
	}

	public leave(el):void {
		let index = parseInt(el.dataset.index);
		gsap.to(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
	}
}
</script>

<style scoped lang="less">
.twitchplaylists{
	
	.fadeIn-enter-active, .fadeIn-leave-active {
		opacity: 1;
		transition: opacity 1.5s;
	}
	.fadeIn-enter, .fadeIn-leave-to {
		opacity: 0;
	}

	h1 {
		margin-bottom: 20px;
	}
	
	.playlists {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		.playlist {
			position: relative;
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