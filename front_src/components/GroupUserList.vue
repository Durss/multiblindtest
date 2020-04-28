<template>
	<div class="groupuserlist">
		<div v-for="(u, index) in users" :key="u.id" :class="userClasses(u)">
			<div class="position">{{index + 1}}</div>
			<div class="pass" v-if="u.pass && !gameComplete">{{$t('group.game.gaveup')}}</div>
			<div class="content">
				<div class="info">
					<div class="username">{{u.name}}</div>
					<div class="score">{{u.score}}</div>
				</div>
				<div class="progressBar">
					<div class="fill" :style="userScorePercentStyles(u)"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import UserData from '../vo/UserData';

@Component({
	components:{}
})
export default class GroupUserList extends Vue {

	@Prop()
	public users;

	@Prop()
	public me;

	@Prop()
	public room;

	@Prop()
	public gameComplete;

	public userClasses(u:UserData):string[] {
		let res = ["player"];
		if(u.id == this.me.id) res.push("me");
		if(u.id == this.room.creator && !u.offline) res.push("host");
		if(u.offline) res.push("offline");
		if(u.pass && !this.gameComplete) res.push("passed");
		return res;
	}

	public mounted():void {
		
	}

	public beforeDestroy():void {
		
	}

	/**
	 * Compute the size of a user's bar
	 */
	public userScorePercentStyles(user:UserData):any {
		let maxScore = 0;
		for (let i = 0; i < this.room.tracksCount; i++) maxScore += i+1;
		maxScore *= this.room.gamesCount;
		let w = (user.score/maxScore*100)+"%";
		return {
			width:w,
		}
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.groupuserlist{

	.player {
		display: flex;
		flex-direction: row;
		align-items: center;

		&:not(:last-child) {
			margin-bottom: 10px;
			padding-bottom: 10px;
			border-bottom: 1px solid @mainColor_normal;
		}
		&.me {
			font-family: "Futura";
		}

		&.offline {
			filter: saturate(0%);
			opacity: .5;
			.content {
				.info {
					&::before {
						background-color: transparent;
						background-image: url("../assets/icons/offline.svg");
						@ratio: 21 / 68;
						width: 68px * @ratio;
						height: 59px * @ratio;
						margin-right: 5px;
						margin-left: 0;
						margin-top: 0;
						border-radius: 0;
						margin-top: 3px;
						opacity: .5;
					}
				}
			}
		}

		&.host {
			.content {
				.info {
					&::before {
						background-color: transparent;
						background-image: url("../assets/icons/king.svg");
						@ratio: 16 / 72;
						width: 100px * @ratio;
						height: 72px * @ratio;
						margin-right: 5px;
						margin-left: 0;
						margin-top: 0;
						border-radius: 0;
						vertical-align: baseline;
					}
				}
			}
		}

		&.passed {
			.pass {
				position: absolute;
				left: 50%;
				transform: translate(-40%) rotate(5deg);
				font-family: "FuturaExtraBold";
				text-transform: uppercase;
				color: #888;
				text-shadow: rgba(0,0,0,.25) 2px 2px 2px;
			}
			.content {
				opacity: .25;
			}
		}

		.position {
			margin-right: 10px;
			font-family: "FuturaExtraBold";
			&::before {
				content: "#";
				display: inline;
				font-size: 15px;
				font-family: "Futura";
			}
		}

		.content {
			display: flex;
			flex-grow: 1;
			flex-direction: column;
			.info {
				display: flex;
				flex-direction: row;
				.username {
					width: 150px;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				&::before {
					content: " ";
					background-color: @mainColor_dark;
					border-radius: 50%;
					display: inline-block;
					width: 5px;
					height: 5px;
					margin-right: 13px;
					margin-top: 7px;
					margin-left: 7px;
					vertical-align: middle;
				}
			}

			.progressBar {
				display: block;
				margin-top: 5px;
				background-color: fade(@mainColor_dark, 25%);
				height: 5px;
				border-radius: 10px;
				overflow: hidden;
				.fill {
					transition: width .5s;
					height: 100%;
					width: 50%;
					background-color: @mainColor_warn_light;
				}
			}
		}
	}
}
</style>