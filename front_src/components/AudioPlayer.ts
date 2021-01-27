import TrackData from '@/vo/TrackData';
import store from '@/store';

export default class AudioPlayer {

	public onLoadComplete:any;
	public onLoadError:any;
	public onNeedUserInteraction:any;
	
	private loadedCount:number = 0;
	private toLoadCount:number = 0;
	private audioObjects:HTMLAudioElement[] = [];
	private loadCompleteHandler:any = null;
	private loadErrorHandler:any = null;
	private trackIdToIndex:any = null;
	private volumeFactor:number = .5;
	
	constructor(private audioCount:number) {
		this.initialize();
	}
	
	
	
	/********************
	 * GETTER / SETTERS *
	 ********************/
	public set volume(value:number) {
		for (let i = 0; i < this.audioObjects.length; i++) {
			this.audioObjects[i].volume = Math.max(0, Math.min(1, value * this.volumeFactor));
		}
	}
	
	
	
	/******************
	 * PUBLIC METHODS *
	 ******************/
	/**
	 * Populate component with tracks infos
	 * @param tracks 
	 */
	public populate(tracks:TrackData[]):void {
		this.trackIdToIndex = {}
		this.loadedCount = 0;
		this.toLoadCount = tracks.length;
		for (let i = 0; i < tracks.length; i++) {
			this.trackIdToIndex[tracks[i].id] = i;
			this.audioObjects[i].setAttribute("data-trackid", tracks[i].id);
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
		this.audioObjects[ index ].pause();
	}

	/**
	 * Restart a paused track
	 * @param track 
	 */
	public unpauseTrack(track:TrackData):void {
		let index = this.trackIdToIndex[track.id];
		if(index == null || index == undefined) return;
		this.audioObjects[ index ].play().catch(error=> {
			//Autoplay failed, show play button
			if(this.onNeedUserInteraction) {
				this.onNeedUserInteraction();
			}
		});
	}

	/**
	 * Stop all tracks
	 */
	public stopAll():void {
		if(!this.audioObjects) return;
		for (let i = 0; i < this.audioObjects.length; i++) {
			this.audioObjects[i].pause();
		}
	}

	/**
	 * Cleansup memory
	 */
	public dispose():void {
		if(!this.audioObjects) return;
		for (let i = 0; i < this.audioObjects.length; i++) {
			const element:HTMLAudioElement = this.audioObjects[i];
			element.pause();
			element.removeAttribute("src");
			element.removeEventListener("error", this.loadErrorHandler);
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
			audio.play().catch(error=> {
				if(!audio.dataset.error) {//this is set to true if MP3 path is wrong
					//Autoplay failed, show play button
					if(this.onNeedUserInteraction) {
						this.onNeedUserInteraction();
					}
				}
			});
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
		this.loadErrorHandler = (e) => this._onLoadError(e)
		
		for (let i = 0; i < this.audioCount; i++) {
			let elem = new Audio();
			elem.loop = true;
			elem.autoplay = false;
			elem.volume = Math.max(0, Math.min(1, store.state.volume * this.volumeFactor));
			elem.addEventListener("canplaythrough", this.loadCompleteHandler);
			elem.addEventListener("error", this.loadErrorHandler);
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
					if(!audio.dataset.error) {//this is set to true if MP3 path is wrong
						//Autoplay failed, tell parent
						if(this.onNeedUserInteraction) {
							this.onNeedUserInteraction();
						}
					}
				});
			}
			
			if(this.onLoadComplete) {
				this.onLoadComplete();
			}
		}
	}

	/**
	 * Called when a track's loading fails
	 */
	public _onLoadError(event:Event):void {
		// this.toLoadCount --;
		this._onLoadComplete(event);
		if(this.onLoadError) {
			let elem = (<HTMLAudioElement>event.currentTarget);
			elem.setAttribute("data-error", "true");
			this.onLoadError(elem.dataset.trackid);
		}
	}
}