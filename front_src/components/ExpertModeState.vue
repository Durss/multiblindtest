<template>
	<div class="expertmodestate">
		<div class="head">
			<img src="@/assets/icons/elite.svg" alt="expert mode" class="icon">
			<div>{{$t('group.game.expertMode.title')}}</div>
		</div>
		<div :class="classes(acceptArtist)">
			<img src="@/assets/icons/checkmark_white.svg" alt="check" v-if="acceptArtist" class="icon">
			<img src="@/assets/icons/cross.svg" alt="check" v-if="!acceptArtist" class="icon">
			<p v-if="acceptArtist">{{$t('group.game.expertMode.acceptArtist')}}</p>
			<p v-if="!acceptArtist">{{$t('group.game.expertMode.refuseArtist')}}</p>
		</div>
		<div :class="classes(acceptTitle)">
			<img src="@/assets/icons/checkmark_white.svg" alt="check" v-if="acceptTitle" class="icon">
			<img src="@/assets/icons/cross.svg" alt="check" v-if="!acceptTitle" class="icon">
			<p v-if="acceptTitle">{{$t('group.game.expertMode.acceptTitle')}}</p>
			<p v-if="!acceptTitle">{{$t('group.game.expertMode.refuseTitle')}}</p>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import RoomData from '../vo/RoomData';

@Component({
	components:{}
})
export default class ExpertModeState extends Vue {

	@Prop()
	public data:string[];

	public get acceptArtist():boolean {
		return this.data.indexOf('artist')>-1
	}

	public get acceptTitle():boolean {
		return this.data.indexOf('title')>-1
	}

	public classes(accept:boolean):string[] {
		let res = ["state"];
		if(!accept) res.push("refuse");
		return res;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.expertmodestate{
	
	background-color: @mainColor_warn;
	border-radius: 20px;
	padding: 10px;
	.head {
		color: #fff;
		display: flex;
		flex-direction: row;
		align-items: center;
		font-family: "Futura";
		justify-content: center;

		.icon {
			height: 30px;
			margin-right: 10px;
		}
	}
	.state {
		display: flex;
		flex-direction: row;
		justify-content: center;
		color: #fff;
		font-size: 16px;

		&.refuse {
			opacity: .75;
			color: #cc0000;
			.icon {
				max-height: 14px;//cross appears bigger than check at the same size
			}
		}

		.icon {
			max-height: 16px;
			margin-right: 5px;
		}
	}
}
</style>