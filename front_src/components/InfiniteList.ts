/**
 * Created by Durss
 */
export default class InfiniteList {
	
		public onScrollStart!:Function;
		public onScrollMove!:Function;
		public onScrollEnd!:Function;
		public onItemClicked!:Function;
		public onItemDestroyed!:Function;
		public onRenderItem!:Function;
		public infiniteMode!:boolean;
		public bounce:boolean = true;
		public dragDistanceY:number = 0;
	
		private _holder:HTMLElement;
		private _subHolder!:HTMLElement;
		private _itemsHolder!:HTMLElement;
		private _domItems!:HTMLDivElement[];
		private _domItemsClickHandlers!:any[];
		private _itemIndexToData!:{[id:number]:any};
		private _itemIndexToPosition!:{[id:number]:number};
		private _scrollbar!:HTMLDivElement;
		private _scroller!:HTMLDivElement;
		private _sizesChanged!:boolean;
		private _invalidateTimeout!:number;
		private _visibleItems!:number;
		private _scrollbarZone!:number;
		private _verticalScroll!:number;
		private _verticalScrollInterpollated!:number;
		private _verticalScrollDirection!:number;
		private _draggingContent!:boolean;
		private _draggingScrollbar!:boolean;
		private _draggingTargetOffset!:number;
		private _draggingOffset!:number;
		private _minYScroll!:number;
		private _mouseYHistory!:number[];
		private _mouseYAverageSpeed!:number;
		private _mouseY!:number;
		private _requestAF!:number;
		private _throwSpeed!:number;
		private _moveDebounce!:number;
		private _startDragScrollbarHandler:any;
		private _startDragListHandler:any;
		private _mouseUpHandler:any;
		private _mouseMoveHandler:any;
		private _disposed:boolean;
	
		private _data!:any[];
		private _visibleWidth!:number;
		private _visibleHeight!:number;
		private _itemHeight:number;
		private _verticalGap:number;
	
		/**
		 * Creates a list component instance
		 * 
		 * @param holder      Holder containing the list
		 * @param itemheight  Items height
		 * @param verticalGap  Items vertical gap (optional)
		 */
		constructor(holder:HTMLElement, itemheight:number, verticalGap:number = 0) {
			this._holder = holder;
			this._itemHeight = itemheight;
			this._verticalGap = verticalGap;
			
			this._holder.style.touchAction = "none";//Avoid warning on "preventDefault" on mouseMove on mobile devices
	
			this._holder.addEventListener("mousewheel", (e:any) => this._onScroll(e));
			this._holder.addEventListener("DOMMouseScroll", (e:any) => this._onScroll(e));//FF
			
			this._initialize();
		}
	
	
		/********************
		 * GETTER / SETTERS *
		 ********************/
		/**
		 * Get the list's holder
		 */
		public get holder():HTMLElement {
			return this._holder;
		}

		/**
		 * Get the current vertical scroll value
		 */
		public get verticalScrollValue():number {
			return this._verticalScrollInterpollated;
		}
	
		/**
		 * Get the vertical scroll direction.
		 * 1 for top ; -1 for bottom ; 0 for static
		 */
		public get verticalScrollDirection():number {
			return this._verticalScrollDirection;
		}

		/**
		 * Gets the item's height
		 */
		public get itemHeight():number { return this._itemHeight; }
	
		/**
		 * Change the item's height
		 */
		public set itemHeight(value:number) {
			this._itemHeight = value;
			this._sizesChanged = true;
			this._invalidate();
		}

		public get verticalGap():number { return this._verticalGap; }
	
		/**
		 * Change vertical gap between items
		 */
		public set verticalGap(value:number) {
			this._verticalGap = value;
			this._sizesChanged = true;
			this._invalidate();
		}
	
		/**
		 * Updates the data collection
		 */
		public set data(value:any[]) {
			this._data = value;
			this._sizesChanged = true;
			this._invalidate();
		}
	
		/**
		 * Gets the data collection
		 */
		public get data():any[] {
			return this._data;
		}
	
		/**
		 * Gets if there is enough content to scroll
		 */
		public get canScroll():boolean {
			return this._scrollbarZone > 0;
		}
	
	
	
		/******************
		 * PUBLIC METHODS *
		 ******************/
	
		/**
		 * Populates the component
		 * 
		 * @param data        Data collection used to populate items
		 */
		public populate(data:any[]):void {
			this._data = data;
			this.validate(true);
		}

		/**
		 * Clears up everything and make the component
		 * garbage collectable
		 */
		public dispose():void {
			if(this._disposed) return;

			for (let i = 0; i < this._domItems.length; i++) {
				const el = this._domItems[i];
				el.removeEventListener("click", this._domItemsClickHandlers[i]);
				(<HTMLElement>el.parentElement).removeChild(el);
			}
			this.onScrollStart = null;
			this.onScrollMove = null;
			this.onScrollEnd = null;
			this.onItemClicked = null;
			this.onItemDestroyed = null;
			this.onRenderItem = null;
			this._holder.removeChild(this._subHolder);
			document.removeEventListener("mousemove", this._mouseMoveHandler);
			document.removeEventListener("touchmove", this._mouseMoveHandler);
			document.removeEventListener("mouseup", this._mouseUpHandler);
			document.removeEventListener("touchend", this._mouseUpHandler);
			this._subHolder.removeEventListener("mousedown", this._startDragListHandler);
			this._subHolder.removeEventListener("touchstart", this._startDragListHandler);
			this._scrollbar.removeEventListener("mousedown", this._startDragScrollbarHandler);
			this._scrollbar.removeEventListener("touchstart", this._startDragScrollbarHandler);

		}
	
		/**
		 * Forces rendering of the component
		 */
		public validate(forceResize:boolean = false):void {
			clearTimeout(this._invalidateTimeout);
			//Don't update the local sizes if the holder is hidden ()
			this._holder.removeChild(this._subHolder);
			let newW:number		= this._holder.clientWidth;
			let newH:number		= this._holder.clientHeight;
			this._sizesChanged	= forceResize || this._sizesChanged || this._visibleHeight != newH || this._visibleWidth != newW;
			this._holder.appendChild(this._subHolder);
			if(this._sizesChanged) {
				this._subHolder.style.height = 'auto';
			}
			this._visibleWidth	= newW;
			this._visibleHeight	= newH;
	
			this._render(true);
		}
	
		/**
		 * Alias of validate() method
		 */
		public render() { this.validate(); }
	
		/**
		 * Scrolls to a specific item by its data
		 * 
		 * @param index item's data
		 */
		public scrollToData(data:any):void {
			for(let i:number=0;i<this._data.length;i++) {
				if(this._data[i] == data) {
					this.scrollToIndex(i);
					break;
				}
			}
		}
	
		/**
		 * Scrolls to a specific item by its index
		 * 
		 * @param index item's index
		 * @returns the holder's referencewe scrolled to
		 */
		public scrollToIndex(index:number):HTMLDivElement {
			if(!this._data) throw("Must set data before scrolling to an index");
	
			this._verticalScroll = -Math.floor(Math.max(0, index - this._domItems.length/2)) * (this._itemHeight + this._verticalGap);
			
			if(!this.infiniteMode) {
				if(!this._minYScroll) {
					this.validate();
				}
				this._limitScroll();
			}
			return this._domItems[(index+1)%this._domItems.length];
		}
	
		/**
		 * Refresh items rendering
		 */
		public refreshItems():void {
			if(!this._data) return;
			this._render(true);
		}
	
	
	
		/*******************
		 * PRIVATE METHODS *
		 *******************/
		/**
		 * Initializes the class
		 */
		private _initialize():void {
			this._domItems = [];
			this._domItemsClickHandlers = [];
			this._itemIndexToData = [];
			this._itemIndexToPosition = [];
			this._mouseYHistory = [];
			this._verticalScroll = 0;
			this._verticalScrollInterpollated = 0;
			this._throwSpeed = 0;
			this._moveDebounce = 0;
			
			//Holder of the list that will be scrolled.
			this._subHolder = document.createElement("div");
			this._subHolder.style.position = "relative";
			this._subHolder.style.overflow = "hidden";
			this._subHolder.className = "infinitelist-mainHolder"
			this._holder.appendChild(this._subHolder);
			
			//Create the items container
			this._itemsHolder = document.createElement("div");
			this._itemsHolder.style.position = "absolute";
			this._itemsHolder.className = "infinitelist-itemsHolder"
			this._subHolder.appendChild(this._itemsHolder);
	
			//Create default scrollbar
			let scrollbarInner:HTMLDivElement = document.createElement("div");
			scrollbarInner.style.display = "block";
			scrollbarInner.style.position = "relative";
			scrollbarInner.style.width = "10px";
			scrollbarInner.style.height = "100%";
			scrollbarInner.style.borderRadius = "4px";
			scrollbarInner.className = "infinitelist-scrollbar-cursor";
			this._scroller = scrollbarInner

			let scrollbarInnerBg:HTMLDivElement = document.createElement("div");
			scrollbarInnerBg.style.display = "block";
			scrollbarInnerBg.style.width = "10px";
			scrollbarInnerBg.className = "infinitelist-scrollbar-bg";
	
			this._scrollbar = document.createElement("div");
			this._scrollbar.style.display = "block";
			this._scrollbar.style.position = "absolute";
			this._scrollbar.style.right = "0px";
			this._scrollbar.style.top = "0px";
			this._scrollbar.style.cursor = "pointer";
			this._scrollbar.style.paddingLeft = "20px";
			this._scrollbar.style.paddingRight = "5px";
			this._scrollbar.style.height = "100%";
			this._scrollbar.className = "infinitelist-scrollbar";
			this._scrollbar.appendChild(scrollbarInner);
			this._scrollbar.appendChild(scrollbarInnerBg);
			this._subHolder.appendChild(this._scrollbar);
	
			this._startDragScrollbarHandler = (e:MouseEvent) => this._startDragScrollbar(e);
			this._scrollbar.addEventListener("mousedown", this._startDragScrollbarHandler);
			this._scrollbar.addEventListener("touchstart", this._startDragScrollbarHandler, {passive: true});
	
			this._startDragListHandler = (e:MouseEvent) => this._startDragList(e);
			this._subHolder.addEventListener("mousedown", this._startDragListHandler);
			this._subHolder.addEventListener("touchstart", this._startDragListHandler, {passive: true});
	
			this._mouseUpHandler = (e:MouseEvent) => this._mouseUp(e);
			document.addEventListener("mouseup", this._mouseUpHandler);
			document.addEventListener("touchend", this._mouseUpHandler);
	
			this._mouseMoveHandler = (e:MouseEvent) => this._mouseMove(e);
			document.addEventListener("mousemove", this._mouseMoveHandler);
			document.addEventListener("touchmove", this._mouseMoveHandler, {passive: true});
		}
	
		/**
		 * Mark the component for invalidation one frame later.
		 */
		private _invalidate():void {
			this._invalidateTimeout = <any>setTimeout(()=> this.validate(), 0);
		}
	
		/**
		 * Called if component's sizes have changed
		 * 
		 * Checks if all the necessary items exists and, if not,
		 * creates them or destroy the exceeding ones.
		 */
		private _onSizesChanged():void {
			if(!this._data) return;

			this._visibleItems = Math.ceil(this._visibleHeight / (this._itemHeight + this._verticalGap));
			let itemsToBuild:number = this._visibleItems + 2;//Need 2 more items so it fills gap if holder goes in positive or negative
			
			if(itemsToBuild > this._domItems.length) {
				//Missing items, build them
				for(let i:number=0; i < itemsToBuild; i++) {
					let item:HTMLDivElement = document.createElement("div");
					item.style.position = "absolute";
					item.className = "listItem";
					let clickHandler = (e:MouseEvent) => this._onClickItem(e, item);
					item.addEventListener("click", clickHandler);
					// item.style.borderLeft = "10px solid #"+((1<<24)*Math.random() | 0x100000).toString(16);
					this._domItems.push( item );
					this._domItemsClickHandlers.push(clickHandler);
					this._itemsHolder.appendChild(item);
				}
	
			}else if(itemsToBuild < this._domItems.length) {
				//Too many items created, destroy some
				while(this._domItems.length > itemsToBuild) {
					let item:HTMLDivElement = this._domItems.pop();
					let clickHandler = this._domItemsClickHandlers.pop();
					delete this._itemIndexToPosition[this._domItems.length];
					item.removeEventListener("click", clickHandler);
					if(this.onItemDestroyed) this.onItemDestroyed(item);
					this._itemsHolder.removeChild(item);
				}
			}
	
			let scrollH:number = Math.max(20, Math.min(this._visibleHeight, (this._visibleItems/this._data.length) * this._visibleHeight));
	
			this._scrollbarZone				= this._visibleHeight - scrollH;
			this._subHolder.style.width		= this._itemsHolder.style.width = this._visibleWidth+"px";
			this._subHolder.style.height	= this._visibleHeight+"px";
			this._itemsHolder.style.height	= (this._itemHeight * this._data.length) + "px";
			this._scroller.style.height		= scrollH+"px";
			this._scrollbar.style.display	= scrollH == this._visibleHeight? "none" : "block";
			this._minYScroll				= Math.min(0, this._visibleHeight - (this._itemHeight + this._verticalGap) * this._data.length + this._verticalGap);
			this._sizesChanged				= false;
		}
	
		/**
		 * Renders the component
		 */
		private _render(force:boolean = false):void {
			if(this._disposed) return;

			if(this._requestAF) cancelAnimationFrame(this._requestAF);//Avoid multiple paralel renderings
			this._requestAF = requestAnimationFrame(_=> this._render());
			
			this._computeAverageMouseSpeed();
	
			if(this._sizesChanged || isNaN(this._minYScroll)) this._onSizesChanged();
			
			
			if(this._draggingScrollbar) {
				let py:number = (this._mouseY - this._draggingOffset + this._draggingTargetOffset);
				this._verticalScroll = Math.max(this._minYScroll, Math.min(0, py/this._scrollbarZone * this._minYScroll));
				this.dragDistanceY = Math.abs(this._mouseY - this._draggingOffset);
			}
			
			if(this._draggingContent) {
				let py:number = (this._mouseY - this._draggingOffset + this._draggingTargetOffset);
				this._verticalScroll = py;
				this.dragDistanceY = Math.abs(this._mouseY - this._draggingOffset);
			}
			
			if(this._limitScroll) {
				//Limit scroll to top
				if(this._verticalScroll > 0) {
					this._throwSpeed *= .5;
					if(this.bounce) {
						this._verticalScroll -= this._verticalScroll * .9;
						if(this._verticalScroll < 1) this._verticalScroll = 0;
					}else{
						this._verticalScroll = 0;
					}
				}
				
				//Limit scroll to bottom
				if(this._verticalScroll < this._minYScroll) {
					this._throwSpeed *= .5;
					if(this.bounce) {
						this._verticalScroll += (this._minYScroll - this._verticalScroll) * .9;
						if(Math.abs(this._minYScroll - this._verticalScroll) < 1) this._verticalScroll = this._minYScroll;
					}else{
						this._verticalScroll = this._minYScroll;
					}
				}
			}
			
			this._verticalScrollDirection = 0;
	
			if(!force && this._verticalScrollInterpollated == this._verticalScroll && this._throwSpeed == 0) return;//Avoid useless rendering
	
			this._verticalScrollDirection = (this._verticalScroll - this._verticalScrollInterpollated)>0? 1 : -1;
			
			if(this.onScrollMove) this.onScrollMove();
	
			if(this._draggingContent || this._draggingScrollbar || Math.abs(this._throwSpeed) < 2) {
				this._throwSpeed = 0;
				this._verticalScrollInterpollated += (this._verticalScroll - this._verticalScrollInterpollated) * .5;
			}else{
				this._throwSpeed *= .96;
				this._verticalScrollInterpollated += this._throwSpeed;
				this._verticalScroll = this._verticalScrollInterpollated;
			}
			if(Math.abs(this._verticalScrollInterpollated - this._verticalScroll) < 1) {
				this._verticalScrollInterpollated = this._verticalScroll;
			}
	
			let i:number, item:HTMLDivElement, len:number = this._domItems.length;
			let itemHG:number = this._itemHeight + this._verticalGap;
			
			//Loop through items to place them
			for(i = 0; i < len; i++) {
				item = this._domItems[i];
	
				//Define item's position
				let index:number = (i + this._verticalScrollInterpollated/itemHG)%len;
				if(index < -1) index += len;
				let py:number = index * itemHG - this._verticalScrollInterpollated;
				py -= itemHG;//offset all from one item to top to avoid a gap when scrolling to top	
				
				//Define item's data index
				let dataIndex:number = Math.round(py/itemHG);
	
				//Define item's visibility
				if(this.infiniteMode) {
					dataIndex = dataIndex % this._data.length;
					if(dataIndex < 0) dataIndex += this._data.length;
				}else{
					if( (dataIndex > this._data.length-1 || dataIndex < 0)) {
						if(item.style.display != "none") {
							item.style.display = "none";
						}
					}else if(item.style.display == "none") {
						item.style.display = "";
					}
				}
				
				//Populate item
				let data = this._data[dataIndex];
				if(item.style.display != "none" && ((this.onRenderItem && this._itemIndexToData[i] != data) || force)) {
					if(this.onRenderItem) {
						this.onRenderItem(data, dataIndex, item);
					}
					this._itemIndexToData[i] = data;
					item.dataset["di"] = dataIndex.toString();
				}
				
				//Move item
				if(this._itemIndexToPosition[i] != py) {
					// item.style.transform = "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0," + Math.round(py) + ", 0, 1)";
					item.style.top = Math.round(py)+"px";
					this._itemIndexToPosition[i] = py;
				}
			}
	
			//Move items holder
			// this._itemsHolder.style.transform = "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0," + Math.round(this._verticalScrollInterpollated) + ", 0, 1)";
			this._itemsHolder.style.top = Math.round(this._verticalScrollInterpollated)+"px";
			this._scroller.style.top = Math.round(this._verticalScrollInterpollated/this._minYScroll * this._scrollbarZone)+"px";
	
		}
	
		/**
		 * Called when using mouse's scroll
		 * @param e 
		 */
		private _onScroll(e:any):void {
			if(!e['deltaY']) e['deltaY'] = e['wheelDelta']? -e['wheelDelta'] : e['detail'];
	
			// this._throwSpeed += -(e["deltaY"] > 0? this._itemHeight : -this._itemHeight) * .1;
			this._verticalScroll -= (e["deltaY"] > 0? this._itemHeight : -this._itemHeight) * 1;
			this._limitScroll();
			e.stopPropagation();
			e.preventDefault();
		}
	
		/**
		 * Called when starting to drag the scrollbar
		 * 
		 * @param e Mouse event
		 */
		private _startDragScrollbar(e:UIEvent):void {
			this._mouseY = (e instanceof MouseEvent)? e.clientY : (<TouchEvent>e).touches[0].clientY;
			this._mouseYHistory = [];
			this._draggingScrollbar = true;
			this._draggingOffset = this._mouseY;
			this._draggingTargetOffset = parseInt(<string>this._scroller.style.top);
			this.dragDistanceY = 0;
	
			if(this.onScrollStart) this.onScrollStart();
	
			e.stopPropagation();
			// e.preventDefault();
		}
	
		/**
		 * Called when starting to drag the list
		 * 
		 * @param e Mouse event
		 */
		private _startDragList(e:UIEvent):void {
			this._mouseY = (e instanceof MouseEvent)? e.clientY : (<TouchEvent>e).touches[0].clientY;
			this._mouseYHistory = [];
			this._draggingContent = true;
			this._draggingOffset = this._mouseY;
			this._draggingTargetOffset = this._verticalScrollInterpollated;
			this.dragDistanceY = 0;
			//If list items contains an <a> tag this will avoid native drag of links by the browser which would
			//block the scrolling of the list via dragging
			//[edit] Disabled as it actually blocks touch/mouse events on mobile. Use draggable="false" on necessary items instead
			// e.preventDefault();
		}
	
		/**
		 * Called when mouse is released
		 * 
		 * @param e Mouse Event
		 */
		private _mouseUp(e:UIEvent):void {
			if(this._draggingContent && !isNaN(this._mouseYAverageSpeed)) {
				if(e instanceof MouseEvent) {
					this._throwSpeed = this._mouseYAverageSpeed;
				}else{
					this._throwSpeed = this._mouseYAverageSpeed * .7;// * Math.abs(this._mouseYAverageSpeed) * .1;// * Math.abs(this._mouseYAverageSpeed) * .01;
				}
			}
			
			if(this._draggingContent || this._draggingScrollbar) {
				if(this.onScrollEnd) this.onScrollEnd();
			}
	
			this._draggingContent = false;
			this._draggingScrollbar = false;
		}
	
	
		/**
		 * Called when mouse moves
		 * 
		 * @param e Mouse Event
		 */
		private _mouseMove(e:UIEvent):void {
			if(++this._moveDebounce % 3 != 0) return;
			if(!this._draggingContent && !this._draggingScrollbar) return;
			this._mouseY = (e instanceof MouseEvent)? e.clientY : (<TouchEvent>e).touches[0].clientY;
	
			this._mouseYHistory.push(this._mouseY);
			if(this._mouseYHistory.length > 2) this._mouseYHistory.shift();
			// e.preventDefault();//Avoid selection on drag on desktop and page scroll on Safari iOs
			this._computeAverageMouseSpeed();
		}
	
		/**
		 * Computes the average mouse speed
		 */
		private _computeAverageMouseSpeed():void {
			this._mouseYAverageSpeed = 0;
			
			if(this._mouseYHistory.length == 0) return;
	
			for(let i:number = 1; i<this._mouseYHistory.length; i++) {
				this._mouseYAverageSpeed += this._mouseYHistory[i] - this._mouseYHistory[i-1];
			}
			this._mouseYAverageSpeed /= (this._mouseYHistory.length-1);
	
		}
	
		/**
		 * Limits the scroll's value
		 */
		private _limitScroll():void {
			this._verticalScroll = Math.max(this._minYScroll, Math.min(0, this._verticalScroll));
		}

		/**
		 * Called when an item is clicked
		 */
		private _onClickItem(e:MouseEvent, item:any) {
			if(this.onItemClicked) {
				this.onItemClicked(this._data[item.dataset["di"]], item.dataset["di"], item)
			}
		}
	}