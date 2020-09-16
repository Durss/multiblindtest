<template>
	<div class="playlistloading">
		<img src="@/assets/loader/loader.svg" alt="loader" class="spinner">
		<img src="@/assets/icons/home_logo.svg" alt="loader" class="logo" ref="logo">
		<h1>{{$t('playlists.loading.title')}}</h1>
		<p class="infos">{{$t('playlists.loading.description')}}</p>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import gsap from 'gsap';

@Component({
	components:{}
})
export default class PlaylistLoading extends Vue {

	public mounted():void {
		this.$nextTick().then(()=>{
			gsap.from(this.$refs.logo, {duration: 1, ease:"Elastic.easeOut", scale:1.2, repeat:100}).yoyo(true);
		})
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.playlistloading{
	display: flex;
	flex-direction: column;
	align-items: center;
	position: fixed;
	.center();
	transform: translate(-50%, -60%);

	.spinner {
		width: 100px;
		height: 100px;
	}

	.logo {
		position: absolute;
		top: 12px;
		width: 70px;
		height: 70px;
	}

	.infos {
		font-style: italic;
		margin-top: 20px;
	}
}
</style>