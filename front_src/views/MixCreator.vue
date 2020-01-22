<template>
	<div class="mixcreator">
		<div class="header">
			<h1>Create a Multiblind Test</h1>
			<p class="infos">Select up to <strong>{{tracksCount}}</strong> tracks to create your own Multiblind Test</p>
		</div>

		<div class="form" v-if="selectedTracks.length < tracksCount">
			<label for="searchField">Search for a song</label>
			<input type="text" id="searchField" placeholder="Song title..." class="input dark" v-model="search" @keyup.esc="search=''" autocomplete="off" @focus="showAutoComplete=search.length>0">
			<img src="@/assets/icons/cross_white.svg" alt="clear" class="clear" @click="search=''" v-if="search && !loading">
			<img src="@/assets/loader/loader_white.svg" alt="loader" class="spinner" @click="search=''" v-if="loading">
		</div>

		<div class="tracksList" v-show="showAutoComplete">
			<div class="autocomplete" key="autocomplete" ref="autocomplete" ></div>
		</div>

		<div class="selectedTracks" v-if="selectedTracks.length > 0">
			<div class="title">Selected tracks</div>
			<div class="trackItem" v-for="(t, index) in selectedTracks" :key="t.id+'_'+index">
				<SearchResultItem :data="t" class="track" />
				<Button :icon="require('@/assets/icons/stop_square.svg')" class="stopBt" @click="stopTrack(t)" v-if="t.isPlaying" />
				<Button :icon="require('@/assets/icons/delete.svg')" highlight class="deleteBt" @click="removeTrack(t)" />
			</div>
		</div>

		<div class="actions">
			<Button :icon="require('@/assets/icons/home.svg')" :to="{name:'playlists'}" />
			<Button :icon="require('@/assets/icons/'+(testing? 'stop_square' : 'play')+'.svg')" title="Test" :disabled="selectedTracks.length == 0" @click="testMix()" :loading="loadingAudio" />
			<Button :icon="require('@/assets/icons/checkmark_white.svg')" title="Create" :disabled="selectedTracks.length < 2" highlight @click="submitMix()" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Inject, Model, Prop, Vue, Watch, Provide } from "vue-property-decorator";
import SpotifyAPI from '@/utils/SpotifyAPI';
import InfiniteList from '@/components/InfiniteList';
import TrackData from '@/vo/TrackData';
import SearchResultItem from '@/components/SearchResultItem.vue';
import Button from '@/components/Button.vue';
import Config from '@/utils/Config';
import AudioPlayer from '../components/AudioPlayer';

@Component({
	components:{
		Button,
		SearchResultItem,
	}
})
export default class MixCreator extends Vue {

	public search:string = "";
	public testing:boolean = false;
	public loading:boolean = false;
	public loadingAudio:boolean = false;
	public showAutoComplete:boolean = false;
	public selectedTracks:TrackData[] = [];
	
	private list:InfiniteList;
	private audioPlayer:AudioPlayer;
	private debounceTimeout:number;
	private listInstances:Vue[] = [];

	public get tracksCount():number { return Config.MAX_TRACK_COUNT; }

	public mounted():void {
		this.list = new InfiniteList(<HTMLDivElement>this.$refs.autocomplete, 40, 1);
		this.list.onRenderItem = (data:any, index:number, holder:HTMLDivElement)=> this.renderItem(data, index, holder);
		this.list.onItemClicked = (data:any, index:number, holder:HTMLDivElement)=> this.onItemClicked(data, index, holder);
		this.list.onItemDestroyed = (holder:HTMLDivElement)=> this.onItemDestroyed(holder);
		this.audioPlayer = new AudioPlayer(Config.MAX_TRACK_COUNT);
		this.audioPlayer.onLoadComplete = () => this.loadingAudio = false;
	}

	public beforeDestroy():void {
		this.list.dispose();
		this.audioPlayer.stopAll();
		this.audioPlayer.dispose();
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
	 * Executes a search with spotify API
	 */
	public async doSearch():Promise<void> {
		if(this.search.length == 0) return;//Field cleared during debounce

		let res = await SpotifyAPI.instance.call("v1/search", {q:this.search, type:"track", limit:50});
		let trackList = [];
		for (let i = 0; i < res.tracks.items.length; i++) {
			const t = res.tracks.items[i];
			if(!t.preview_url) continue;
			let alreadySelected = false;
			for (let j = 0; j < this.selectedTracks.length; j++) {
				const element = this.selectedTracks[j];
				if(element.id == t.id) alreadySelected = true;
			}
			if(alreadySelected) continue;
			let trackData:TrackData = {
				id: t.id,
				name: t.name,
				artist: t.artists[0].name,
				audioPath: t.preview_url,
				picture:t.album.images? t.album.images[0].url : null,
				isPlaying:false,
			};
			trackList.push(trackData);
		}

		this.showAutoComplete = trackList.length > 0;
		this.$nextTick().then(_=> {
			//Wait for component to be displayed to get proper size compute of list
			this.list.populate(trackList);
			this.list.scrollToIndex(0);
			this.list.refreshItems();
			this.loading = false;
		})
	}

	/**
	 * Renders an item of the auto complete list
	 */
	private renderItem(data:TrackData, index:number, holder:HTMLDivElement) {
		let itemIndex = 0;
		if(holder.dataset.initialized !== "true") {
			let ComponentClass = Vue.extend(SearchResultItem)
			let instance = new ComponentClass();
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
		this.selectedTracks.push(data);
		this.showAutoComplete = false;
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
	 * Removes a track from the list
	 */
	public removeTrack(data:TrackData):void {
		for (let i = 0; i < this.selectedTracks.length; i++) {
			const t = this.selectedTracks[i];
			if(t.id == data.id) {
				this.selectedTracks.splice(i, 1);
				break;
			}
		}
		this.audioPlayer.stopTrack(data);
	}

	/**
	 * Stops a specific track
	 */
	public stopTrack(t:TrackData):void {
		t.isPlaying = false;
		this.audioPlayer.stopTrack(t);
		for (let i = 0; i < this.selectedTracks.length; i++) {
			if(this.selectedTracks[i].isPlaying) return;
		}
		this.testing = false;
	}

	/**
	 * Start mix testing
	 */
	public testMix():void {
		if(this.testing) {
			this.audioPlayer.stopAll();
			this.testing = false;
			return;
		}
		this.testing = true;
		this.loadingAudio = true;
		this.audioPlayer.populate(this.selectedTracks);
		for (let i = 0; i < this.selectedTracks.length; i++) {
			this.selectedTracks[i].isPlaying = true;
		}
	}

	/**
	 * Submits the mix
	 */
	public submitMix():void {
		let ids = this.selectedTracks.map(t => t.id);
		this.$router.push({name:"player/tracks", params:{tracksids:ids.join(",")}});
	}

}
</script>

<style scoped lang="less">
@import (reference) '../less/_includes.less';
.mixcreator{
	max-width: 90%;
	margin: auto;
	position: relative;
	.header {
		text-align: center;
		h1 {
			margin-bottom: 10px;
		}
	}

	.form{
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 2;
		.clear, .spinner {
			position: absolute;
			bottom: 10px;
			right: 10px;
			width: 20px;
			height: 20px;
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
		}
	}

	.selectedTracks {
		display: flex;
		flex-direction: column;
		margin-top: 30px;

		.title {
			font-size: 20px;
			font-weight: bold;
			margin-bottom: 5px;
		}

		.trackItem {
			display: flex;
			flex-direction: row;
			margin-bottom: 5px;
			.track {
				flex-grow: 1;
				pointer-events: none;
			}
			.deleteBt, .stopBt {
				width: 40px;
				height: 40px;
				min-width: 40px;
				min-height: 40px;
			}
		}
	}

	.actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin-top: 30px;
		&>*:not(:last-child) {
			margin-right: 10px;
		}
	}
}

@media only screen and (max-width: 500px) {
	.mixcreator{
		.tracksList {
			.autocomplete {
				max-height: 200px;
			}
		}
	}
}
</style>