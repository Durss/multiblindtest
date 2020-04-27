import Utils from './Utils';
import Fuse from 'fuse.js';
import TrackData from '@/vo/TrackData';

export default class AnswerTester {
	
	private static _instance:AnswerTester;

	private logsEnabled:boolean = false;
	
	constructor() {
		this.initialize();
	}
	
	
	
	/********************
	 * GETTER / SETTERS *
	 ********************/
	
	/**
	 * Gets the singleton's reference
	 */
	public static get instance():AnswerTester {
		if(!this._instance) this._instance = new AnswerTester();
		return this._instance;
	}
	
	
	
	/******************
	 * PUBLIC METHODS *
	 ******************/
	public run():void {
		this.checkTest("dont stop", "don't stop moving", true);
		this.checkTest("worlds", "worlds appart", true);
		this.checkTest("worlds ap", "worlds appart", true);
		this.checkTest("showbiz", "Showbiz (the battle)", true);
		this.checkTest("papa", "Papa pingouin", false);
		this.checkTest("pingouin", "Papa pingouin", true);
		this.checkTest("franky vinc", "Francky Vincent", true);
		this.checkTest("freedom", "Freedom! '90", true);
		this.checkTest("wassup", "What's Up?", true);
		this.checkTest("lambé", "Lambé An Dro", true);
		this.checkTest("redhot hcilli pappers", "Red Hot Chili Peppers", true);
		this.checkTest("walk on the", "Walk On the Wild Side", true);
		this.checkTest("shame on you", "Shame on U", true);
		this.checkTest("stach stach", "Stach Stach — Karaoké Avec Chant Témoin — Rendu Célèbre Par Bratisla Boys", true);
		this.checkTest("que calor", "Que Calor (feat. J Balvin & El Alfa)", true);
		this.checkTest("test of a title", "test of a title longer than (the parenthesis)", true);
		this.checkTest("test with a (complete answer !)", "test with a (complete answer !)", true);
		this.checkTest("death bed", "death bed (coffee for your head) (feat. beabadoobee)", true);
		this.checkTest("bed", "death bed (coffee for your head) (feat. beabadoobee)", false);
		this.checkTest("coffee for your", "death bed (coffee for your head) (feat. beabadoobee)", true);
		this.checkTest("céliendion", "Céline Dion", true);

		// this.testFuse([{id:"0", name: "death bed (coffee for your head) (feat. beabadoobee)", artist:"kf", audioPath:""}], "coffee for your head")
	}

	/**
	 * Search within a collection of track via Fuse.js search engine
	 */
	public testFuse(tracksList:TrackData[], userAnswer:string):TrackData {
		let minAnswer = 999999;
		for (let i = 0; i < tracksList.length; i++) {
			const t = tracksList[i];
			if(t.artist.length < minAnswer) minAnswer = t.artist.length;
			if(t.name.length < minAnswer) minAnswer = t.name.length;
		}
		minAnswer *= .25;
		console.log("MIN SEARCH", minAnswer)

		let opts = {
			includeScore: true,
			includeMatches: true,
			minMatchCharLength: minAnswer,
			// Search in `author` and in `tags` array
			keys: ['artist', 'name']
		}
		let search = new Fuse(tracksList, opts);
		let res = search.search(userAnswer);
		console.log(res);
		for (let i = 0; i < res.length; i++) {
			console.log(res[i].item.artist, res[i].item.name, " ==> ", res[i]);
			let minSize = res[i].matches[0].value.replace(/(.*)(\[|\().*?(\)|\])$/gi, "$1").length * .5;
			console.log(userAnswer.length, minSize);
			if(res[i].score < .35 && userAnswer.length >= minSize) {
				return res[i].item;
			}
		}
		return null;
	}

	/**
	 * Test a user answer compared to an expected answer
	 */
	public test(userAnswer:string, expectedAnswer:string, reducedTolerence:boolean = false):boolean {
		expectedAnswer = expectedAnswer.trim();
		//remove some arbitrary data like "- radio edit" from names.
		//not a big fan of these but couldn't find any alternative
		expectedAnswer = expectedAnswer.replace(/ ?- ?(original)?.?radio.edit/gi, "").trim();
		expectedAnswer = expectedAnswer.replace(/ ?- ?version radio/gi, "").trim();
		expectedAnswer = expectedAnswer.replace(/ ?- ?bonus track/gi, "").trim();

		//If string ends with something between parenthesis/brackets and if that parenthesis
		//makes more than half of the string's length. Test the answer without the parenthesis
		//and, if it fail, proceed to normal testing
		let tmpAnswer = expectedAnswer.replace(/(.*)(\[|\().*?(\)|\])$/gi, "$1").trim();
		if(tmpAnswer.length != expectedAnswer.length ) {
			//recursive test until there are no more ending parenthesis
			if(this.test(userAnswer, tmpAnswer, reducedTolerence)) return true;
		}

		//Remove punctuation to make it easier
		let cleanAnswer = this.cleanup(expectedAnswer);
		let cleanUserAnswer = this.cleanup(userAnswer);
		let chunks = expectedAnswer.split(" ").map(s => this.cleanup(s));
		let tolerence = reducedTolerence? .2 : .3;
		
		//Check for answer with elastic error tolerence
		let costs = {insert:null, remove:.5, substitute:.5, transpose:0};
		// console.log(Utils.levenshtein(cleanUserAnswer, cleanAnswer), Utils.levenshteinDamerau(cleanUserAnswer, cleanAnswer, costs), cleanAnswer)
		let res1 = Utils.levenshteinDamerau(cleanUserAnswer, cleanAnswer, costs) < cleanAnswer.length * tolerence;
		if(this.logsEnabled) {
			console.log("%cLevenstein :", "font-size:16px;color:blue;font-weight:bold"+(res1? ";color:green" : ";color:red"), cleanUserAnswer + " VS " + cleanAnswer, Utils.levenshteinDamerau(cleanUserAnswer, cleanAnswer, costs), "/", (cleanAnswer.length * .3).toFixed(1));
		}

		//check for exact occurence in answer to be able to write a shortened version of the answer.
		let res2 = (userAnswer.length >= expectedAnswer.length * .5) && cleanAnswer.indexOf(cleanUserAnswer) > -1
		if(this.logsEnabled) {
			console.log("%cShort answer :", "font-size:16px;color:blue;font-weight:bold"+(res2? ";color:green" : ";color:red"), res2);
		}

		//check for one specific word longer than 5 chars
		let res3 = (userAnswer.length >= 5 || cleanUserAnswer.length >= cleanAnswer.length * .5) && chunks.indexOf(cleanUserAnswer) > -1;
		if(this.logsEnabled) {
			console.log("%cExact word :", "font-size:16px;color:blue;font-weight:bold"+(res3? ";color:green" : ";color:red"), res3);
		}

		//If answer is longer than 8 chars, check its exact match (workaround stupidly long titles with useless informations on it)
		let res4 = (userAnswer.length >= 9) && cleanAnswer.indexOf(cleanUserAnswer) > -1;
		if(this.logsEnabled) {
			console.log("%cExact word long :", "font-size:16px;color:blue;font-weight:bold"+(res4? ";color:green" : ";color:red"), res4, userAnswer, cleanAnswer.indexOf(cleanUserAnswer));
		}
		
		if(this.logsEnabled) console.log("");
		
		return res1 || res2 || res3 || res4;
	}
	
	
	
	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize():void {
		
	}

	private checkTest(answer:string, expected:string, result:boolean):void {
		if(this.test(answer, expected) !== result) {
			console.warn("Test failed : ", answer, " :: ", expected);
		}
	}

	private cleanup(str:string):string {
		return Utils.removeDiacritics(str).toLowerCase().replace(/[^A-z0-9]/gi, "");
	}
}