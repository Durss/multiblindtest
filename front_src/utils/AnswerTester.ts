import Utils from './Utils';

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
		this.checkTest("stach stach", "Stach Stach — Karaoké Avec Chant Témoin — Rendu Célèbre Par Bratisla Boys", true);
	}

	public test(userAnswer:string, answer:string, reducedTolerence:boolean = false):boolean {
		//Remove punctuation to make it easier
		let cleanAnswer = this.cleanup(answer);
		let cleanUserAnswer = this.cleanup(userAnswer);
		let chunks = answer.split(" ").map(s => this.cleanup(s));
		let tolerence = reducedTolerence? .2 : .3;
		
		//Check for answer with elastic error tolerence
		let res1 = Utils.levenshtein(cleanUserAnswer, cleanAnswer) < cleanAnswer.length * tolerence;
		if(this.logsEnabled) {
			console.log("%cLevenstein :", "font-size:16px;color:blue;font-weight:bold"+(res1? ";color:green" : ";color:red"), cleanUserAnswer + " VS " + cleanAnswer, Utils.levenshtein(cleanUserAnswer, cleanAnswer), "/", (cleanAnswer.length * .3).toFixed(1));
		}

		//check for exact occurence in answer to be able to write a shortened version of the answer.
		let res2 = (userAnswer.length >= answer.length * .5) && cleanAnswer.indexOf(cleanUserAnswer) > -1
		if(this.logsEnabled) {
			console.log("%cShort answer :", "font-size:16px;color:blue;font-weight:bold"+(res2? ";color:green" : ";color:red"), res2);
		}

		//check for one specific word longer than 5 chars
		let res3 = (userAnswer.length > 5) && chunks.indexOf(cleanUserAnswer) > -1;
		if(this.logsEnabled) {
			console.log("%cExact word :", "font-size:16px;color:blue;font-weight:bold"+(res3? ";color:green" : ";color:red"), res3);
			console.log("")
		}

		//If answer is longer than 9 chars, check its exact match (workaround stupidly long titles with useless informations on it)
		let res4 = (userAnswer.length > 9) && cleanAnswer.indexOf(cleanUserAnswer) > -1;
		if(this.logsEnabled) {
			console.log("%cExact word long :", "font-size:16px;color:blue;font-weight:bold"+(res4? ";color:green" : ";color:red"), res4);
			console.log("")
		}

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
		return str.toLowerCase().replace(/[^A-z0-9]/gi, "");
	}
}