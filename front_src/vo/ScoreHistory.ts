export default interface ScoreHistory {
	trackId:string;
	guesserId:string;
	score:number;
	guesserName?:string;//Only used for twitch mode to reduce data transfer with pears
 }