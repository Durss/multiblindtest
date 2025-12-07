<template>
	<div class="changelog">
		<h1 class="header">{{$t('changelog.title')}}</h1>
		<div v-for="(log, index) in logs" :key="'l_'+index" class="log">
			<div class="date">{{log.date}}</div>
			<ul>
				<li v-for="(update, index) in log.updates" :key="'u_'+index" v-html="update"></li>
			</ul>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({
	components:{}
})
export default class ChangeLog extends Vue {

	public logs = this.$t('changelog.logs') as unknown as {date:string, updates:string[]}[];

	public mounted():void {
		
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

				::v-deep a > {
					background-color: fade(@mainColor_highlight, 10%);
					padding: 0 5px;
					border-radius: 5px;
					line-height: 22px;
					transition: all .25s;
					&:hover {
						color: @mainColor_warn;
						background-color: fade(#fff, 10%);
					}
				}
			}
		}
	}
}
</style>