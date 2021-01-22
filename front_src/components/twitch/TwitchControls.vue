<template>
	<div class="twitchcontrols">
		<ToggleBlock class="block" title="OBS params">
			<div class="cb showZone">
				<Button type="checkbox" id="noBg" v-model="showZone_local" />
				<label for="noBg" @click="showZone_local = !showZone_local">Show capture area</label>
			</div>

			<div class="cb noBg">
				<Button type="checkbox" id="noBg" v-model="noBackground" />
				<label for="noBg" @click="noBackground = !noBackground">Transparent Background</label>
			</div>
		</ToggleBlock>

		<ToggleBlock class="block" title="Player controls">
			<Button :icon="require('@/assets/icons/play.svg')" @click="$emit('start')" />
			<Button :icon="require('@/assets/icons/pause.svg')" @click="$emit('pause')" />
			<Button @click="$emit('next')" title="Next" />
		</ToggleBlock>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from "../Button.vue";
import ToggleBlock from "../ToggleBlock.vue";

@Component({
	components:{
		Button,
		ToggleBlock,
	}
})
export default class TwitchControls extends Vue {

	@Prop()
	public showZone:boolean;

	public showZone_local:boolean = false;
	public noBackground:boolean = false;

	public mounted():void {
		this.noBackground = this.$store.state.hideBackground === true;
		this.showZone_local = this.showZone;
	}

	public beforeDestroy():void {
		
	}

	@Watch("noBackground")
	private onBgChange():void {
		this.$store.dispatch("setHideBackground", this.noBackground);
	}

	@Watch("showZone")
	private onShowZoneChange():void {
		this.showZone_local = this.showZone;
	}

	@Watch("showZone_local")
	private toggleDashes() {
		this.$emit("update:showZone", this.showZone_local)
	}

}
</script>

<style scoped lang="less">
.twitchcontrols{
	display: flex;
	flex-direction: row;
	min-width: 400px;
	flex-wrap: wrap;
	.block {
		&:not(:last-child) {
			margin-right: 10px;
		}
		/deep/ h2 {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

		.cb {
			&:not(:last-child) {
				margin-bottom: 5px;
			}
			.button {
				margin-right: 5px;
				vertical-align: bottom;
			}
			label {
				cursor: pointer;
			}
		}
	}
}
</style>