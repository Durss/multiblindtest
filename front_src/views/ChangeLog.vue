<template>
	<div class="changelog">
		{{url}}
		<h1 class="header">{{$t('changelog.title')}}</h1>
		<div v-for="(log, index) in $t('changelog.logs')" :key="'l_'+index" class="log">
			<div class="date">{{log.date}}</div>
			<ul>
				<li v-for="(update, index) in log.updates" :key="'u_'+index">{{update}}</li>
			</ul>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";

@Component({
	components:{}
})
export default class ChangeLog extends Vue {

	public get url():string{ return document.location.href; }

	public mounted():void {
		let logs = this.$t("changelog");
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.changelog{
	.log {
		margin-bottom: 50px;
		.date {
			font-weight: bold;
			text-align: center;
		}
		ul {
			list-style: disc;
			li {
				margin-bottom: 5px;
			}
		}
	}
}
</style>