<template>
	<div class="gameparams">
		<h2>{{$t('group.lobby.params')}}</h2>
		<div class="content">
			<slot></slot>
			<IncrementForm class="increment" :title="$t('group.lobby.gameDuration')" v-model="gameDuration_local" maxValue="900" minValue="10" :tenStep="true"/>
			<IncrementForm class="increment" :title="$t('group.lobby.gamesCount')" v-model="gamesCount_local" maxValue="99" />
			<IncrementForm class="increment" :title="$t('group.lobby.tracksCount')" v-model="tracksCount_local" maxValue="6" />
			<ExpertModeForm v-model="expertMode_local" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import ExpertModeForm from "./ExpertModeForm.vue";
import IncrementForm from "./IncrementForm.vue";

@Component({
	components:{
		IncrementForm,
		ExpertModeForm,
	}
})
export default class GameParams extends Vue {

	@Prop({default:10})
	public gamesCount:number;

	@Prop({default:120})
	public gameDuration:number;
	
	@Prop({default:4})
	public tracksCount:number;

	@Prop({default:null})
	public expertMode:string[];

	public expertMode_local:string[] = null;
	public gamesCount_local:number = 0;
	public tracksCount_local:number = 0;
	public gameDuration_local:number = 0;

	public mounted():void {
		this.gamesCount_local = this.gamesCount;
		this.tracksCount_local = this.tracksCount;
		this.expertMode_local = this.expertMode;
		this.gameDuration_local = this.gameDuration;
	}

	public beforeDestroy():void {
		
	}

	@Watch("tracksCount_local")
	private onTrackChange():void { this.$emit("update:tracksCount", this.tracksCount_local); }

	@Watch("gamesCount_local")
	private onGamesChange():void { this.$emit("update:gamesCount", this.gamesCount_local); }

	@Watch("expertMode_local")
	private onModeChange():void { this.$emit("update:expertMode", this.expertMode_local); }

	@Watch("gameDuration_local")
	private onDurationChange():void { this.$emit("update:gameDuration", this.gameDuration_local); }

	@Watch("tracksCount")
	private onTrackValueChange():void { this.tracksCount_local=this.tracksCount; }

	@Watch("gamesCount")
	private onGamesValueChange():void { this.gamesCount_local=this.gamesCount; }

	@Watch("expertMode")
	private onModeValueChange():void { this.expertMode_local=this.expertMode; }

	@Watch("gameDuration")
	private onDurationValueChange():void { this.gameDuration_local=this.gameDuration; }

}
</script>

<style scoped lang="less">
.gameparams{
	.content {
		.blockContent();
	}
}
</style>