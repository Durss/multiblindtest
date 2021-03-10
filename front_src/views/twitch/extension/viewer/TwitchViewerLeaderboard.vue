<template>
	<div class="twitchviewerleaderboard">
		<div class="scrollable" ref="scrollable">
			<div class="page podium">
				<div class="user" :data-index="index" v-for="(u,index) in podium" :key="u.name+''+index">
					<div class="background">
						<div class="score" v-if="u.score>0">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.name}}</div>
					</div>
					<div class="foreground">
						<div class="score" v-if="u.score>0">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.name}}</div>
					</div>
					<div class="step">#{{[2,1,3][index]}}</div>
				</div>
			</div>

			<div class="page otherPlayers">
				<div class="scrollable" ref="otherPlayers">
					<div class="user" v-for="(u,index) in users" :key="u.name+''+index" :style="getRowStyle(u)">
						<div class="pos">#{{index+4}}</div>
						<div class="name">{{u.name}}</div>
						<div class="score">{{u.score}}<span class="exp">pts</span></div>
					</div>
				</div>
			</div>
		</div>

		<div class="nav" v-if="users.length > 0">
			<Button :title="expandResults? '▲' : '▼'" @click="toggleResults()" />
		</div>
	</div>
</template>

<script lang="ts">
import Button from "@/components/Button.vue";
import Utils from "@/utils/Utils";
import ScoreHistory from "@/vo/ScoreHistory";
import gsap from "gsap";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
	components:{
		Button
	}
})
export default class TwitchViewerLeaderboard extends Vue {

	@Prop({default:null})
	public scoreHistory:ScoreHistory[];

	public expandResults:boolean = false;
	public podium:{name:String, score:number}[] = [];
	public users:{name:String, score:number}[] = [];

	public getRowStyle(u:any):any {
		let res:any = {};
		return res;
		// let color = "#"+((Math.random()*0x99 + 0x66)<<16 | (Math.random()*0x99 + 0x66)<<8 | (Math.random()*0x99 + 0x66)).toString(16);
		let color = u.user.color;
		res["background-color"] = color;
		let lum = Utils.getLuminance(color);
		if(lum < .72) res["color"] = "#ffffff";
		return res;
	}

	public mounted():void {
		this.users = [];
		let data:any = this.$store.state.twitchLeaderboard;
		let history:ScoreHistory[] = data.history;

		for (let i = 0; i < history.length; i++) {
			let u = this.users.find(u => u.name == history[i].guesserName);
			if(!u) {
				u = {name:history[i].guesserName, score:history[i].score};
				this.users.push(u);
			}else{
				u.score += history[i].score;
			}
		}

		this.users.sort((a,b)=> {
			if(a.score > b.score) return -1;
			if(a.score < b.score) return 1;
			return 0;
		});

		//Make sure there are at least 3 "users"
		while(this.users.length < 3) this.users.push({name:"x", score:-1});
		// for (let i = 0; i < 100; i++) {
		// 	this.users.push(this.users[0]);
		// }

		//Set N°1 in the middle
		this.podium = this.users.splice(0,3);
		this.podium.splice(1, 0, this.podium.splice(0,1)[0]);
	}

	public beforeDestroy():void {
		
	}

	public toggleResults():void {
		this.expandResults = !this.expandResults;
		let pageH = (<HTMLDivElement>this.$refs.scrollable).getBoundingClientRect().height;
		gsap.to(this.$refs.scrollable, {duration:.5, scrollTo:this.expandResults? pageH : 0, ease:"Quad.easeInOut"});
	}

}
</script>

<style scoped lang="less">
.twitchviewerleaderboard{

	.nav {
		text-align: center;
		margin-top: 20px;
	}

	.scrollable {
		height: 20em;
		overflow: hidden;
	
		.page {
			height: 20em;
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
			min-width: 20em;
			width: min-content;
			.user {
				flex-grow: 1;
				position: relative;
				text-align: center;
				max-width: 10em;
				.name {
					font-family: "Futura";
					font-size: 2em;
					word-wrap: break-word;
					padding-left: 20px;
					padding-right: 20px;
				}
				.score {
					font-family: "FuturaExtraBold";
					font-size: 2.5em;
					.exp {
						font-family: "Futura";
						font-size: .5em;
						vertical-align: top;
					}
				}
				.background {
					-webkit-text-stroke: .2em #fff;
				}
				.foreground {
					position: absolute;
					top: 0;
					margin: auto;
					width: 100%;
				}
	
				.step {
					margin-top: .5em;
					width: ~"calc(100% - 1px)";
					display: flex;
					justify-content: center;
					align-items: center;
					color: #ffffff;
					font-family: "FuturaExtraBold";
					font-size: 2em;
				}
			}
			.user:nth-child(1) {
				.step {
					height: 3em;
					background-color: @mainColor_normal;
				}
			}
			.user:nth-child(2) {
				.step {
					height: 4em;
					background-color: @mainColor_normal;
				}
			}
			.user:nth-child(3) {
				.step {
					height: 2em;
					background-color: @mainColor_normal;
				}
			}
		}
	
		.otherPlayers {
			margin-top: 20px;
			margin-bottom: 20px;
			height: calc(20em - 20px);
			background-color: rgba(255,255,255,1);
			border-radius: 20px;
			overflow: hidden;
			.scrollable {
				overflow: auto;
				padding: 10px;
				height: 100%;
				width: 100%;
				box-sizing: border-box;
				.user {
					text-align: center;
					display: flex;
					flex-direction: row;
					width: 100%;
					display: flex;
					flex-direction: row;
					justify-content: center;
					margin-bottom: .2em;
					padding: .2em .5em;
					border-radius: 20px;
					box-sizing: border-box;
					color: @mainColor_dark;
					align-items: center;
	
					.name {
						flex-grow: 1;
						text-align: center;
						font-family: "Futura";
						font-size: 1.25em;
						margin-right: 10px;
					}
					.score {
						font-family: "Futura";
						font-size: 1.5em;
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
						font-size: 1em;
						font-family: "Futura";
						text-align:left;
						margin-right: 10px;
						min-width: 2em;
					}
				}
			}
		}
	}
}
</style>