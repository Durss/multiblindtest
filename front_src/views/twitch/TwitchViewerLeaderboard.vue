<template>
	<div class="twitchviewerleaderboard">
		<div class="scrollable" ref="scrollable">
			<div class="page podium">
				<div class="user" :data-index="index" v-for="(u,index) in podium" :key="u.name+''+index">
					<div class="background" v-if="u.name">
						<div class="score">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.name}}</div>
					</div>
					<div class="foreground" v-if="u.name">
						<div class="score">{{u.score}}<span class="exp">pts</span></div>
						<div class="name">{{u.name}}</div>
					</div>
					<div class="step">#{{[2,1,3][index]}}</div>
				</div>
			</div>

			<div class="page otherPlayers" ref="otherPlayers">
				<div class="user" v-for="(u,index) in users" :key="u.name+''+index" :style="getRowStyle(u)">
					<div class="pos">#{{index+4}}</div>
					<div class="name">{{u.name}}</div>
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
import Button from "@/components/Button.vue";
import { IRCTypes } from "@/twitch/IRCClient";
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
	public scoreHistory:ScoreHistory[];// = JSON.parse('[{"trackId":"0FE9t6xYkqWXU2ahLh6D8X","guesserId":"29961813","score":4},{"trackId":"5MoDQWMDMaAGDEiWsJfeCi","guesserId":"29961813","score":3},{"trackId":"2Ld2LehpgQNREMxl9LlIzm","guesserId":"29961813","score":4},{"trackId":"4E8hgGDOwG5CpiEke6qZMT","guesserId":"29961813","score":3},{"trackId":"0GJ8C7j0kIWYhPkQBpdmXz","guesserId":"29961813","score":2},{"trackId":"0lCUMRsPuqWI8LY95UIRGp","guesserId":"29961813","score":1},{"trackId":"5aRh9MryKg4B8NC1X6DvF1","guesserId":"29961813","score":4},{"trackId":"6vEL7E8TGzrxuxbrgdlkLL","guesserId":"29961813","score":3},{"trackId":"71yCMlsD6qbD7NmNUEoVNR","guesserId":"29961813","score":4},{"trackId":"0CJ31BEjjl1tPIj0CKi9kH","guesserId":"29961813","score":3},{"trackId":"3WMbD1OyfKuwWDWMNbPQ4g","guesserId":"29961813","score":2},{"trackId":"6jvxZ978pjyBAJtmxs3Jed","guesserId":"29961813","score":1},{"trackId":"225xvV8r1yKMHErSWivnow","guesserId":"29961813","score":4},{"trackId":"1xsRqL4cvEaOQ5TbXpqaAV","guesserId":"29961813","score":3},{"trackId":"2m1hi0nfMR9vdGC8UcrnwU","guesserId":"29961813","score":2},{"trackId":"2BiuDwHRRXaQgKpRkfaBSw","guesserId":"29961813","score":1},{"trackId":"6Xy5uUkWNaGH63i32cAYAH","guesserId":"29961813","score":4},{"trackId":"4Bt1Zyfti01GJI1d4iZXpl","guesserId":"29961813","score":3},{"trackId":"5nzV7yTSN9u614lcHvfH1a","guesserId":"29961813","score":2},{"trackId":"77nF1t4qesuOJRd8lbIzNX","guesserId":"29961813","score":1},{"trackId":"07aWTEpDmPPCx5XkqhRHfH","guesserId":"29961813","score":4},{"trackId":"50tmSBLbNVXMf7XDlViN00","guesserId":"29961813","score":3},{"trackId":"2Ms33RTRCT6gArrpcrPxmo","guesserId":"29961813","score":2},{"trackId":"2nOZaGwMYt07nXtIeYbEiu","guesserId":"29961813","score":4},{"trackId":"7APhfGjNSqcNiS0eXNVjcK","guesserId":"29961813","score":3},{"trackId":"1wthYeOSBWfUYeCqhYcGt0","guesserId":"29961813","score":2},{"trackId":"6tof0wqt0Tiyz19KQ218Kr","guesserId":"29961813","score":1},{"trackId":"1PNPtLq340zP1xzu9ixm2d","guesserId":"29961813","score":4},{"trackId":"1g0hvVrfTQqaovToVe5l6e","guesserId":"29961813","score":3},{"trackId":"2vIEquOWG8DTVgwIOofocm","guesserId":"29961813","score":2},{"trackId":"6KoolqHOo79c4lTmAko7NQ","guesserId":"29961813","score":1},{"trackId":"0S4dVpqBLnBFj4wdB4UDMd","guesserId":"29961813","score":4},{"trackId":"3W6QMYxsqM8tFE8sX5ZhGd","guesserId":"29961813","score":3},{"trackId":"6buspRjru75yJjseBhKCAt","guesserId":"29961813","score":2},{"trackId":"0weAUscowxeqDtpCgtbpgp","guesserId":"29961813","score":1}]');

	public expandResults:boolean = false;
	public podium:{name:String, score:number}[] = [];
	public users:{name:String, score:number}[] = [];

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
		this.users = [];
		let data:any = this.$store.state.twitchLeaderboard;
		let history:ScoreHistory[] = data.history;

		for (let i = 0; i < history.length; i++) {
			this.users.push({name:history[i].guesserName, score:history[i].score});
		}

		this.users.sort((a,b)=> {
			if(a.score > b.score) return -1;
			if(a.score < b.score) return 1;
			return 0;
		});

		//Make sure there are at least 3 "users"
		while(this.users.length < 3) this.users.push({name:"", score:0});

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
.twitchviewerleaderboard{

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