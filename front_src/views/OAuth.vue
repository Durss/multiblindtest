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
import Store from "@/store/Store";

@Component({
	components:{
		Home,
	}
})
export default class OAuth extends Vue {

	public isError:boolean = false;

	public async mounted():Promise<void> {
		const error = Utils.getQueryParameterByName("error");
		const code = Utils.getQueryParameterByName("code");
		if(!error && code) {
			console.log(">>>>1")
			const authRes = await this.$store.dispatch("authenticate", {code:code});
			this.isError = !authRes;
			console.log("error?", this.isError);
			
			if(this.isError) return;
			
			let redirect = Store.get("redirect");
			if(redirect) {
				Store.remove("redirect");
				window.location.href = redirect;
			}else{
				//Redirect to home
				this.$router.push({name:"home"});
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
		margin-bottom: 20px;
		.title {
			font-family: "FuturaExtraBold";
			text-align: center;
			margin-bottom: 10px;
		}
	}
}
</style>