<template>
	<div class="oauth">
		
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import PlaylistSelector from './PlaylistSelector.vue';
import SpotifyAPI from '../utils/SpotifyAPI';

@Component({
	components:{
		PlaylistSelector,
	}
})
export default class OAuth extends Vue {

	public mounted():void {
		let redirect = localStorage.getItem("redirect");
		console.log("REDIR :: "+redirect)
		//Convert hash to key/value object
		let vars = JSON.parse('{"' + decodeURI(document.location.hash.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
		if(vars.access_token) {
			
			this.$store.dispatch("authenticate", {access_token:vars.access_token});

			if(redirect) {
				window.location.href = redirect;
				localStorage.removeItem("redirect");
			}else{
				//Redirect to playlist selector
				this.$router.push({name:"playlists"});
			}
		}else{
			//TODO
		}
	}

	public beforeDestroy():void {

	}


}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.oauth{
}
</style>