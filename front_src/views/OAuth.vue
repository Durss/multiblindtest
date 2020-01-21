<template>
	<div class="oauth">
		<div v-if="isError" class="error">
			<p class="title">You must grant access to your playlists to play Multiblind Test</p>
			<p class="infos">Don't worry, <strong>Multiblind Test</strong> only requests for playlists <strong>read</strong> permission, it will never be able to change anything on your spotify account.</p>
		</div>
		<Home v-if="isError" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SpotifyAPI from '../utils/SpotifyAPI';
import Home from './Home.vue';
import Utils from '../utils/Utils';

@Component({
	components:{
		Home,
	}
})
export default class OAuth extends Vue {

	public isError:boolean = false;

	public mounted():void {
		let error = Utils.getQueryParameterByName("error");
		if(!error && document.location.hash) {

			//Convert hash to key/value object
			let vars = JSON.parse('{"' + decodeURI(document.location.hash.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
			if(vars.access_token) {
				let redirect = localStorage.getItem("redirect");
				this.$store.dispatch("authenticate", {access_token:vars.access_token});
	
				if(redirect) {
					window.location.href = redirect;
					localStorage.removeItem("redirect");
				}else{
					//Redirect to playlist selector
					this.$router.push({name:"playlists"});
				}
			}
		}else{
			this.isError = true;
		}
	}

	public beforeDestroy():void {

	}


}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.oauth{
	.error {
		color: #fff;
		border-radius: 10px;
		padding: 10px;
		background-color: @mainColor_warn;
		.title {
			font-family: "FuturaExtraBold";
			text-align: center;
			margin-bottom: 10px;
		}
	}
}
</style>