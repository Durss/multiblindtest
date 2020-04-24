import TrackData from '@/vo/TrackData';

export default class AudioPlayer {

	public onLoadComplete:any;
	public onNeedUserInteraction:any;
	
	private loadedCount:number = 0;
	private toLoadCount:number = 0;
	private audioObjects:HTMLAudioElement[] = [];
	private trackToPauseState:{[id:string]:boolean} = {};
	private loadCompleteHandler:any = null;
	private trackIdToIndex:any = null;
	
	constructor(private audioCount:number) {
		this.initialize();
	}
	
	
	
	/********************
	 * GETTER / SETTERS *
	 ********************/
	
	
	
	/******************
	 * PUBLIC METHODS *
	 ******************/
	/**
	 * Populate component with tracks infos
	 * @param tracks 
	 */
	public populate(tracks:TrackData[]):void {
		this.trackIdToIndex = {}
		this.trackToPauseState = {};
		this.loadedCount = 0;
		this.toLoadCount = tracks.length;
		for (let i = 0; i < tracks.length; i++) {
			this.trackIdToIndex[tracks[i].id] = i;
			this.audioObjects[i].setAttribute("src", tracks[i].audioPath);
		}
	}

	/**
	 * Stops a track from playing
	 * @param track 
	 */
	public stopTrack(track:TrackData):void {
		if(!this.trackIdToIndex) return;
		let index = this.trackIdToIndex[track.id];
		if(index == null || index == undefined) return;
		// if(this.trackToPauseState[track.id] === true) return;
		this.audioObjects[ index ].pause();
	}

	/**
	 * Restart a paused track
	 * @param track 
	 */
	public unpauseTrack(track:TrackData):void {
		let index = this.trackIdToIndex[track.id];
		if(index == null || index == undefined) return;
		// if(this.trackToPauseState[track.id] !== true) return;
		this.audioObjects[ index ].play();
	}

	/**
	 * Stop all tracks
	 */
	public stopAll():void {
		for (let i = 0; i < this.audioObjects.length; i++) {
			this.audioObjects[i].pause();
		}
	}

	/**
	 * Cleansup memory
	 */
	public dispose():void {
		for (let i = 0; i < this.audioObjects.length; i++) {
			const element:HTMLAudioElement = this.audioObjects[i];
			element.pause();
			element.removeAttribute("src");
			element.removeEventListener("canplaythrough", this.loadCompleteHandler)
		}
		delete this.audioObjects;
		delete this.trackIdToIndex;
		delete this.onLoadComplete;
		delete this.onNeedUserInteraction;
	}

	/**
	 * Start audio playing
	 */
	public play():void {
		for (let i = 0; i < this.audioObjects.length; i++) {
			const audio = this.audioObjects[i];
			audio.play();
		}
	}

	/**
	 * Pauses audio playing
	 */
	public pause():void {
		for (let i = 0; i < this.audioObjects.length; i++) {
			const audio = this.audioObjects[i];
			audio.pause();
		}
	}
	
	
	
	/*******************
	 * PRIVATE METHODS *
	 *******************/
	/**
	 * Initializes the class
	 */
	private initialize():void {
		this.loadCompleteHandler = (e) => this._onLoadComplete(e)
		
		for (let i = 0; i < this.audioCount; i++) {
			let elem = new Audio();
			elem.loop = true;
			elem.autoplay = false;
			elem.volume = .5;//TODO RESET TO 1
			elem.addEventListener("canplaythrough", this.loadCompleteHandler);
			this.audioObjects.push(elem);
		}
	}

	/**
	 * Called when an audio file loading completes
	 * Check for all complete to start playing
	 */
	public _onLoadComplete(event):void {
		if(++this.loadedCount == this.toLoadCount) {
			//All tracks are ready to be played
			for (let i = 0; i < this.audioObjects.length; i++) {
				const audio = this.audioObjects[i];
				audio.play().catch(error=> {
					//Autoplay failed, show play button
					if(this.onNeedUserInteraction) {
						this.onNeedUserInteraction();
					}
				});
			}
			
			if(this.onLoadComplete) {
				this.onLoadComplete();
			}
		}
	}
}