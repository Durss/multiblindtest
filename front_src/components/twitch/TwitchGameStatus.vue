<template>
	<div class="TwitchGameStatus">
		<transition name="fadeIn">
			<div class="title" v-if="playlists.length > 0">
				<!-- <h1>Game will start soon</h1> -->
				<img src="@/assets/icons/home_logo_outlined.svg" alt="logo" class="logo">
				<div v-if="expertMode">💪🏻 expert mode</div>
			</div>
		</transition>
		
		<Button v-if="playlists.length > 0" title="Join the game" type="checkbox" v-model="iwannaplay" class="joinBt" big />

		<div class="playlistsTitle">{{$tc('twitch.viewer.selectedPlaylists', playlists.length)}}</div>
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
import { Component, Vue, Watch } from "vue-property-decorator";
import Button from "../Button.vue";

@Component({
	components:{
		Button,
	}
})
export default class TwitchGameStatus extends Vue {

	public iwannaplay:boolean = false;

	public get expertMode():boolean {
		return this.$store.state.twitchExpertMode;
	}

	public get playlists():{name:string,cover:string}[] {
		let list:any[] = JSON.parse(JSON.stringify(this.$store.state.twitchPlaylists));
		if(!list) return [];
		return list;
	}

	public mounted():void {
		this.onPlayChange();
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

	public leave(el:HTMLDivElement):void {
		let index = parseInt(el.dataset.index);
		gsap.to(el, {top:-20, opacity:0, duration:.5, delay:index*.1});
	}

	@Watch("iwannaplay")
	public onPlayChange():void {
		this.$store.dispatch("setVolume", this.iwannaplay? .5 : 0);
	}
}
</script>

<style scoped lang="less">
.TwitchGameStatus{
	
	.fadeIn-enter-active, .fadeIn-leave-active {
		opacity: 1;
		transition: opacity 1.5s;
	}
	.fadeIn-enter, .fadeIn-leave-to {
		opacity: 0;
	}

	.title {
		text-align: center;
		margin-bottom: 20px;
	}

	.logo {
		height: 100px;
	}

	.playlistsTitle {
		font-size: 20px;
		margin-top: 20px;
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
			padding: 2px 10px 2px 2px;
			box-sizing: border-box;
			width: min-content;
			white-space: nowrap;
			max-width: 100%;
			margin-bottom: 5px;
			&:not(:last-child) {
				margin-right: 5px;
			}
			.label {
				color: #fff;
				margin-left: 5px;
				font-size: 14px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.cover {
				width: 25px;
				height: 25px;
				border-radius: 50%;
				object-fit: cover;
			}
		}
	}
}
</style>