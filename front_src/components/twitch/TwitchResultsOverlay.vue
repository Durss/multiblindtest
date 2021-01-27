<template>
	<div class="twitchresultsoverlay">
		<div class="scrollable" ref="scrollable">
			<div class="page podium">
				<div class="user" :data-index="index" v-for="(u,index) in podium" :key="u.user.id+''+index">
					<div class="background">
						<div class="score">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.user.username}}</div>
					</div>
					<div class="foreground">
						<div class="score">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.user.username}}</div>
					</div>
					<div class="step">#{{[2,1,3][index]}}</div>
				</div>
			</div>

			<div class="page otherPlayers" ref="otherPlayers">
				<div class="user" v-for="(u,index) in users" :key="u.user.id+''+index" :style="getRowStyle(u)">
					<div class="pos">#{{index+4}}</div>
					<div class="name">{{u.user.username}}</div>
					<div class="score">{{u.score}}<span class="exp">pts</span></div>
				</div>
			</div>
		</div>

		<div class="nav">
			<Button :title="expandResults? '▲' : '▼'" @click="toggleResults()" />
		</div>
	</div>
</template>

<script lang="ts">
import TrackData from "@/vo/TrackData";
import ScoreHistory from "@/vo/ScoreHistory";
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import { IRCTypes } from "@/twitch/IRCClient";
import Button from "../Button.vue";
import TwitchUtils from "@/twitch/TwitchUtils";
import gsap from "gsap";
import Utils from "@/utils/Utils";

@Component({
	components:{
		Button
	}
})
export default class TwitchResultsOverlay extends Vue {

	@Prop({default:null})
	public scoreHistory:ScoreHistory[];

	public expandResults:boolean = false;
	public podium:{user:IRCTypes.Tag, score:number}[] = [];
	public users:{user:IRCTypes.Tag, score:number}[] = [];

	public getRowStyle(u:any):any {
		let res:any = {};
		// let color = "#"+((Math.random()*0x99 + 0x66)<<16 | (Math.random()*0x99 + 0x66)<<8 | (Math.random()*0x99 + 0x66)).toString(16);
		let color = u.user.color;
		res["background-color"] = color;
		let lum = Utils.getLuminance(color);
		if(lum < .72) res["color"] = "#ffffff";
		return res;
	}

	public mounted():void {
		// console.log(JSON.stringify(this.scoreHistory));
		this.users = [];
		let usersDone:any = {}
		let twitchUsers:IRCTypes.Tag[] = this.$store.state.twitchAllowedUsers;

		for (let i = 0; i < twitchUsers.length; i++) {
			this.users.push({user:twitchUsers[i], score:0});
			this.users.push({user:twitchUsers[i], score:0});
			this.users.push({user:twitchUsers[i], score:0});
		}

		for (let i = 0; i < this.scoreHistory.length; i++) {
			const h = this.scoreHistory[i];
			let user = this.users.find(u=>u.user["user-id"] == h.guesserId);
			if(!user) continue;
			user.score += h.score;
		}

		this.users.sort((a,b)=> {
			if(a.score > b.score) return -1;
			if(a.score < b.score) return 1;
			return 0;
		});

		//Set N°1 in the middle
		this.podium = this.users.splice(0,3);
		this.podium.splice(1, 0, this.podium.splice(0,1)[0]);
	}

	public beforeDestroy():void {
		
	}

	public toggleResults():void {
		this.expandResults = !this.expandResults;
		gsap.to(this.$refs.scrollable, {duration:.5, scrollTo:this.expandResults? 330 : 0, ease:"Quad.easeInOut"});
	}

}
</script>

<style scoped lang="less">
.twitchresultsoverlay{

	.nav {
		text-align: center;
		margin-top: 20px;
	}

	.scrollable {
		height: 330px;
		overflow: hidden;
	
		.page {
			height: 330px;
			overflow: auto;
			box-sizing: border-box;
		}
		
		.podium {
			left: auto;
			right: auto;
			display: flex;
			flex-direction: row;
			justify-content: stretch;
			align-items: flex-end;
			min-width: 500px;
			width: min-content;
			.user {
				flex-grow: 1;
				position: relative;
				text-align: center;
				max-width: 300px;
				.name {
					font-family: "Futura";
					font-size: 40px;
					word-wrap: break-word;
					padding-left: 20px;
					padding-right: 20px;
				}
				.score {
					font-family: "FuturaExtraBold";
					font-size: 40px;
					.exp {
						font-family: "Futura";
						font-size: 20px;
						vertical-align: top;
					}
				}
				.background {
					-webkit-text-stroke: 10px #fff;
				}
				.foreground {
					position: absolute;
					top: 0;
					margin: auto;
					width: 100%;
				}
	
				.step {
					margin-top: 20px;
					width: ~"calc(100% - 1px)";
					display: flex;
					justify-content: center;
					align-items: center;
					color: #ffffff;
					font-family: "FuturaExtraBold";
					font-size: 40px;
				}
			}
			.user:nth-child(1) {
				.step {
					height: 140px;
					background-color: @mainColor_normal;
				}
			}
			.user:nth-child(2) {
				.step {
					height: 180px;
					background-color: @mainColor_normal;
				}
			}
			.user:nth-child(3) {
				.step {
					height: 100px;
					background-color: @mainColor_normal;
				}
			}
		}
	
		.otherPlayers {
			margin-top: 20px;
			margin-bottom: 20px;
			height: 310px;
			.user {
				text-align: center;
				display: flex;
				flex-direction: row;
				width: 100%;
				display: flex;
				flex-direction: row;
				justify-content: center;
				margin-bottom: 3px;
				padding: 2px 5px;
				border-radius: 20px;
				box-sizing: border-box;
				color: @mainColor_dark;
				align-items: center;

				.name {
					flex-grow: 1;
					text-align: center;
					font-family: "Futura";
					font-size: 25px;
					margin-right: 10px;
				}
				.score {
					font-family: "Futura";
					font-size: 30px;
					margin-right: 10px;
					min-width: 40px;
					text-align:left;
					font-weight: bold;
					.exp {
						font-family: "Futura";
						font-size: 14px;
						vertical-align: top;
					}
				}
	
				.pos {
					font-size: 20px;
					font-family: "Futura";
					text-align:left;
					margin-right: 10px;
					min-width: 40px;
				}
			}
		}
	}
}
</style>