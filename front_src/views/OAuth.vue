<template>
	<div class="oauth">
		<div v-if="isError" class="error">
			<p class="title">{{$t('oAuth.title')}}</p>
			<p class="infos" v-html="$t('oAuth.subtitle')"></p>
		</div>
		<Home v-if="isError" />
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SpotifyAPI from '@/utils/SpotifyAPI';
import Home from './Home.vue';
import Utils from '@/utils/Utils';

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
				this.$store.dispatch("authenticate", {access_token:vars.access_token, expires_in:vars.expires_in});
	
				if(redirect) {
					localStorage.removeItem("redirect");
					window.location.href = redirect;
				}else{
					//Redirect to home
					this.$router.push({name:"home"});
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