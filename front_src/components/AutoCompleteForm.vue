<template>
	<div class="autocompleteform">
		<div :class="formClasses">
			<label for="searchField">{{label}}</label>
			<input type="text" id="searchField" :placeholder="$t('create.search.placeholder')" class="input dark" v-model="search" @keyup.esc="onClearSearch" autocomplete="off" @focus="showAutoComplete=search.length>0">
			<img src="@/assets/icons/cross_white.svg" alt="clear" class="clear" @click="onClearSearch" v-if="search && !loading">
			<img src="@/assets/loader/loader.svg" alt="loader" class="spinner" v-if="loading">
		</div>

		<div class="tracksList" v-show="showAutoComplete">
			<div class="autocomplete" key="autocomplete" ref="autocomplete" ></div>
		</div>

		<div class="noResult" v-if="showNoResult">{{$t("global.noResult")}}</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import InfiniteList from '@/components/InfiniteList';
import TrackData from '@/vo/TrackData';
import SearchTrackResultItem from '@/components/SearchTrackResultItem.vue';
import SearchPlaylistResultItem from '@/components/SearchPlaylistResultItem.vue';
import Button from '@/components/Button.vue';
import Config from '@/utils/Config';
import Utils from '../utils/Utils';
import SpotifyAPI from '../utils/SpotifyAPI';
import PlaylistData from '../vo/PlaylistData';


@Component({
	components:{
		Button,
		SearchTrackResultItem,
		SearchPlaylistResultItem,
	}
})
export default class AutoCompleteForm extends Vue {

	@Prop({default:"track"})
	public searchType:string;

	@Prop()
	public filteredItems:any[];

	@Prop({default:500})
	public maxResult:number;

	@Prop({default:10})
	public maxSelectable:number;

	public search:string = "";
	public loading:boolean = false;
	public showNoResult:boolean = false;
	public showAutoComplete:boolean = false;
	public timeoutNoResult:number;

	private listInstances:Vue[] = [];
	private list:InfiniteList;
	private debounceTimeout:number;

	public get formClasses():string[] { 
		let res = ["form"];
		if(this.loading) res.push("loading");
		return res;
	}

	public get label():string {
		let key = this.searchType=="track"? "create.search.label" : "playlists.search";
		return this.$t(key).toString();
	}

	public mounted():void {
		this.list = new InfiniteList(<HTMLDivElement>this.$refs.autocomplete, 40, 1);
		this.list.onRenderItem = (data:any, index:number, holder:HTMLDivElement)=> this.renderItem(data, index, holder);
		this.list.onItemClicked = (data:any, index:number, holder:HTMLDivElement)=> this.onItemClicked(data, index, holder);
		this.list.onItemDestroyed = (holder:HTMLDivElement)=> this.onItemDestroyed(holder);
		
	}

	public beforeDestroy():void {
		this.list.dispose();
	}

	/**
	 * Executes a search with spotify API
	 */
	public async doSearch():Promise<void> {
		clearTimeout(this.timeoutNoResult);
		if(this.search.length == 0) return;//If field is cleared during debounce
		this.showNoResult = false;
		let res, offset:number = 0;
		let items:any[] = [];
		let key = {"track":"tracks", "playlist":"playlists"}[this.searchType];
		do {
			var search = this.search;
			try {
				res = await SpotifyAPI.instance.call("v1/search", {q:this.search, type:this.searchType, limit:50, include_external:false, offset});
			}catch(error) {
				//For some reason i get 404 on some valid playlist search
				res[key].next = null;//Avoid loading anything more
			}
			if(search != this.search) {
				//New search made in between, ignore this result
				return;
			}

			//Parse all results
			for (let i = 0; i < res[key].items.length; i++) {
				const t = res[key].items[i];
				let alreadySelected = false;
				switch(this.searchType) {
					default:
					case "track":
						if(!t.preview_url) continue;
						for (let j = 0; j < this.filteredItems.length; j++) {
							if(this.filteredItems[j].id == t.id) alreadySelected = true;
						}
						if(alreadySelected) continue;
						let trackData:TrackData = {
							id: t.id,
							name: t.name,
							artist: t.artists[0].name,
							audioPath: t.preview_url,
							picture:t.album.images && t.album.images.length > 0? t.album.images[0].url : null,
							isPlaying:false,
						};
						items.push(trackData);
						break;

					case "playlist":
						// console.log("ADD", this.filteredItems);
						for (let j = 0; j < this.filteredItems.length; j++) {
							if(this.filteredItems[j].id == t.id) alreadySelected = true;
						}
						if(alreadySelected) continue;
						let playlistData:PlaylistData = {
							id: t.id,
							name: t.name,
							cover: t.images && t.images.length > 0? t.images[0].url : null,
							owner: t.owner.display_name,
							tracks: new Array(t.tracks.total),
						};
						// console.log(playlistData)
						items.push(playlistData);
						break;
				}
			}

			if(offset == 0) {
				this.showAutoComplete = items.length > 0;
			}
			this.$nextTick().then(_=> {
				//Wait for component to be displayed to get proper size computation of the list
				this.list.populate(items);
				if(offset == 0) {
					this.list.scrollToIndex(0);
				}
				this.list.refreshItems();
			});
			offset += 50;
		}while(res[key].next && items.length < this.maxResult);
		this.showNoResult = items.length == 0;
		this.timeoutNoResult = setTimeout(_=> {
			this.showNoResult = false;
		}, 2000);
		this.loading = false;
	}

	/**
	 * Called when searching for something
	 */
	@Watch("search")
	public onSearch():void {
		if(this.search.length == 0) {
			this.showAutoComplete = false;
		}else{
			this.loading = true;
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = setTimeout(()=>this.doSearch(), 200);
		}
	}

	/**
	 * Renders an item of the auto complete list
	 */
	private renderItem(data:TrackData, index:number, holder:HTMLDivElement) {
		let itemIndex = 0;
		if(holder.dataset.initialized !== "true") {
			let clazz = this.searchType == "track" ? SearchTrackResultItem : SearchPlaylistResultItem;
			let ComponentClass = Vue.extend(clazz)
			let instance = new ComponentClass({
				router:this.$router,
				store:this.$store,
				// t:this.$t,//doesn't work...
			});
			instance.$mount();
			holder.appendChild(instance.$el);
			holder.dataset.initialized = "true";
			itemIndex = this.listInstances.length;
			holder.dataset.index = itemIndex.toString();
			this.listInstances[itemIndex] = instance;
		}else{
			itemIndex = parseInt(holder.dataset.index);
		}
		this.listInstances[itemIndex].$props.data = data;
	}

	/**
	 * Called when an item is clicked on the list
	 */
	private onItemClicked(data:TrackData, index:number, holder:HTMLDivElement) {
		// let res = this.filteredItems.concat(data);
		this.showAutoComplete = false;
		let list = this.list.data;
		for (let i = 0; i < list.length; i++) {
			if(list[i].id == data.id) {
				list.splice(i, 1);
			}
		}
		this.list.populate(list);
		// res = res.splice(Math.max(0, res.length - this.maxSelectable), this.maxSelectable);
		this.$emit("select", data);
	}

	/**
	 * Called when an item is destroyed
	 */
	private onItemDestroyed(holder:HTMLDivElement) {
		let itemIndex = parseInt(holder.dataset.index);
		if(!isNaN(itemIndex)) {
			let vueItem = this.listInstances[itemIndex];
			vueItem.$destroy();
		}
	}

	/**
	 * Clears the current search
	 */
	private onClearSearch():void {
		this.search = "";
		this.showNoResult = false;
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.autocompleteform{
	.form {
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 2;
		label {
			align-self: flex-start;
		}

		.input {
			transition: all .25s;
		}
	
		&.loading {
			.input {
				padding-left: 40px;
			}
		}
		.clear, .spinner {
			position: absolute;
			bottom: 10px;
			right: 10px;
			width: 20px;
			height: 20px;
			&.spinner {
				left: 10px;
			}
		}
		.clear {
			cursor: pointer;
			transition: all .2s;
			&:hover {
				transform: scale(1.15);
			}
		}
	}

	.tracksList {
		margin-top: -20px;
		padding-top: 20px;
		padding-bottom: 10px;
		box-sizing: border-box;
		background-color: @mainColor_dark_light;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
		position: absolute;
		z-index: 1;
		width: 500px;
		max-width: 100%;

		.autocomplete {
			max-height: 300px;
			height: 400px;
			border-bottom-left-radius: 20px;
			border-bottom-right-radius: 20px;
			overflow: hidden;
			color: @mainColor_dark;
		}
	}
	
	.noResult {
		color: #fff;
		font-style: italic;
		text-align: center;
		padding: 5px 15px;
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
		display: block;
		white-space: nowrap;
		margin: auto;
		width: min-content;
		background-color: @mainColor_warn;
	}
}

@media only screen and (max-width: 500px) {
	.autocompleteform{
		.tracksList {
			.autocomplete {
				max-height: 200px;
			}
		}
	}
}
</style>