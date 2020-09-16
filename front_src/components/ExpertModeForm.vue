<template>
	<div class="expertmodeform">
		<div class="toggle">
			<Button type="checkbox" id="expertmode" v-model="enabled" />
			<label for="expertmode">{{$t('group.lobby.expertMode.title')}}</label>
		</div>
		<div v-if="enabled" class="form">
			<p class="infos">{{$t("group.lobby.expertMode.details")}}</p>
			<div class="checkboxes">
				<div class="row">
					<Button type="checkbox" id="expertmode_title" v-model="acceptTitle" />
					<label for="expertmode_title">{{$t('group.lobby.expertMode.acceptTitle')}}</label>
				</div>
				<div class="row">
					<Button type="checkbox" id="expertmode_artist" v-model="acceptArtist" />
					<label for="expertmode_artist">{{$t('group.lobby.expertMode.acceptArtist')}}</label>
				</div>
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

	private enabled:boolean = false;
	private acceptTitle:boolean = true;
	private acceptArtist:boolean = true;

	public mounted():void {
		if(this.value && this.value.length > 0) {
			for (let i = 0; i < this.value.length; i++) {
				if(this.value[i] !== null) this.enabled = true;
				if(this.value[i] == "artist") this.acceptArtist = true;
				if(this.value[i] == "title") this.acceptTitle = true;
			}
		}
	}

	public beforeDestroy():void {
		
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
		.checkboxes {
			.row {
				display: flex;
				flex-direction: row;
				align-items: center;
				margin-top: 5px;
				::v-deep .button {
					width: 20px;
					height: 20px;
				}
				label {
					margin: 0;
					margin-left: 5px;
					font-size: 16px;
					cursor: pointer;
				}
			}
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