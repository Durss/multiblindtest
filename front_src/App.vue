<template>
	<div class="app">
		<router-view class="content"/>
		<Alert />
		<Tooltip />
		<transition name="slide" appear>
			<Button class="backHome"
				v-if="$route.meta.hideHomeBt!==true"
				:to="{name:'home'}"
				:icon="require('@/assets/icons/home.svg')"
				big
			/>
		</transition>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import Tooltip from "./components/Tooltip.vue";
import Confirm from "./views/Confirm.vue";
import Alert from "./views/AlertView.vue";
import Button from './components/Button.vue';

@Component({
	components:{
		Alert,
		Tooltip,
		Confirm,
		Button,
	}
})
export default class App extends Vue {

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

}
</script>

<style scoped lang="less">
.app{
	.content {
		max-width: 500px;
		margin: auto;
		padding: 20px 0;
	}

	.backHome {
		position: absolute;
		top: 0;
		left: 0;
		border-radius: 0;
		border-bottom-right-radius: 50%;

		&.slide-enter-active, &.slide-leave-active {
			transition: all .5s;
			transform: translate(0, 0);
		}
		&.slide-enter, &.slide-leave-to {
			transform: translate(-100%, -100%);
		}
	}
}

@media only screen and (max-width: 500px) {
	.app{
		.content {
			width: 90%;
		}
	}
}
</style>