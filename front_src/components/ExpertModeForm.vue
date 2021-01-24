<template>
	<div class="expertmodeform">
		<div class="toggle">
			<Button type="checkbox" v-model="enabled" :title="$t('group.lobby.expertMode.title')" />
		</div>
		<div v-if="enabled" class="form">
			<p class="infos">{{$t("group.lobby.expertMode.details")}}</p>
			<div class="checkboxes">
				<Button type="checkbox" v-model="acceptTitle" :title="$t('group.lobby.expertMode.acceptTitle')" />
				<Button type="checkbox" v-model="acceptArtist" :title="$t('group.lobby.expertMode.acceptArtist')" />
			</div>
			<div v-if="enabled && !acceptArtist && !acceptTitle" class="selectSomething">{{$t('group.lobby.expertMode.selectSomething')}}</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Button from './Button.vue';

@Component({
	components:{
		Button,
	}
})
export default class ExpertModeForm extends Vue {

	@Prop()
	public value:"artist"|"title"[];

	private isMount:boolean = false;
	private enabled:boolean = false;
	private acceptTitle:boolean = true;
	private acceptArtist:boolean = true;

	public mounted():void {
		this.isMount = true;
		this.onValueChanged();
		this.isMount = false;
	}

	public beforeDestroy():void {
		
	}
	@Watch("value")
	private onValueChanged():void {
		if(this.value && this.value.length > 0) {
			this.acceptArtist = false;
			this.acceptTitle = false;
			for (let i = 0; i < this.value.length; i++) {
				if(this.value[i] !== null) this.enabled = true;
				if(this.value[i] == "artist") this.acceptArtist = true;
				if(this.value[i] == "title") this.acceptTitle = true;
			}
		}else if(this.isMount){
			this.enabled = false;
		}
	}

	@Watch("acceptArtist")
	private onChangeTitle():void { this.update(); }
	@Watch("acceptTitle")
	private onChangeArtist():void { this.update(); }
	@Watch("enabled")
	private onChangeEnabled():void { this.update(); }

	private update():void {
		if(!this.enabled) {
			this.$emit("input", null);
			return;
		}
		let res = [];
		if(this.acceptTitle) res.push("title");
		if(this.acceptArtist) res.push("artist");
		this.$emit("input", res);
	}

}
</script>

<style scoped lang="less">
.expertmodeform{
	.toggle {
		display: flex;
		flex-direction: row;
		align-items: center;
		label {
			margin: 0;
			margin-left: 10px;
			font-size: 18px;
			cursor: pointer;
		}
	}
	.form {
		margin-top: 5px;
		padding: 10px;
		border-top: 1px solid @mainColor_normal;
		background-color: fade(@mainColor_normal, 20%);
		color: @mainColor_dark;
		.infos {
			font-size: 16px;
			width: 260px;
			margin-bottom: 10px;
		}
		.selectSomething {
			margin-top: 10px;
			background-color: @mainColor_warn;
			padding: 5px 10px;
			border-radius: 10px;
			color: #fff;
		}
	}
}
</style>