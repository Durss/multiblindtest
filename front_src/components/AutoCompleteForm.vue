<template>
	<div class="autocompleteform">
		<div :class="formClasses">
			<label for="searchField">{{label}}</label>
			<input type="text" id="searchField" :placeholder="t('create.search.placeholder')" class="input dark" v-model="search" @keyup.esc="onClearSearch" autocomplete="off" @focus="showAutoComplete=search.length>0">
			<img src="@/assets/icons/cross_white.svg" alt="clear" class="clear" @click="onClearSearch" v-if="search && !loading">
			<img src="@/assets/loader/loader.svg" alt="loader" class="spinner" v-if="loading">
		</div>

		<div class="tracksList" v-show="showAutoComplete">
			<div class="autocomplete" key="autocomplete" ref="autocomplete" ></div>
		</div>

		<div class="noResult" v-if="showNoResult">{{t("global.noResult")}}</div>
	</div>
</template>

<script setup lang="ts">
import InfiniteList from '@/components/InfiniteList';
import TrackData from '@/vo/TrackData';
import SearchTrackResultItem from '@/components/SearchTrackResultItem.vue';
import SearchPlaylistResultItem from '@/components/SearchPlaylistResultItem.vue';
import SpotifyAPI from '../utils/SpotifyAPI';
import PlaylistData from '../vo/PlaylistData';
import { computed, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, ref, render, useTemplateRef, watch, type Component } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{
	searchType?:string;
	filteredItems?:any[];
	maxResult?:number;
	maxSelectable?:number;
}>(), {
	searchType:"track",
	maxResult:500,
	maxSelectable:10,
});

const emit = defineEmits<{
	select:[data:any];
}>();

const { t } = useI18n();
//Used to give access to router/store/i18n to the manually rendered items
const appContext = getCurrentInstance().appContext;

const autocomplete = useTemplateRef<HTMLDivElement>("autocomplete");

const search = ref<string>("");
const loading = ref<boolean>(false);
const showNoResult = ref<boolean>(false);
const showAutoComplete = ref<boolean>(false);

let timeoutNoResult:number;
let list:InfiniteList;
let debounceTimeout:ReturnType<typeof setTimeout>;
let renderedHolders = new Set<HTMLDivElement>();

const formClasses = computed(():string[] => {
	let res = ["form"];
	if(loading.value) res.push("loading");
	return res;
});

const label = computed(():string => {
	let key = props.searchType=="track"? "create.search.label" : "playlists.search";
	return t(key);
});

onMounted(() => {
	list = new InfiniteList(autocomplete.value, 40, 1);
	list.onRenderItem = (data:any, index:number, holder:HTMLDivElement)=> renderItem(data, index, holder);
	list.onItemClicked = (data:any, index:number, holder:HTMLDivElement)=> onItemClicked(data, index, holder);
	list.onItemDestroyed = (holder:HTMLDivElement)=> onItemDestroyed(holder);

});

onBeforeUnmount(() => {
	renderedHolders.forEach(holder => render(null, holder));
	renderedHolders.clear();
	list.dispose();
});

/**
 * Executes a search with spotify API
 */
async function doSearch():Promise<void> {
	clearTimeout(timeoutNoResult);
	if(search.value.length == 0) return;//If field is cleared during debounce
	showNoResult.value = false;
	let res, offset:number = 0;
	let items:any[] = [];
	let key = {"track":"tracks", "playlist":"playlists"}[props.searchType];
	do {
		var currentSearch = search.value;
		try {
			res = await SpotifyAPI.instance.call("v1/search", {q:search.value, type:props.searchType, limit:50, include_external:false, offset});
		}catch(error) {
			//For some reason i get 404 on some valid playlist search
			res[key].next = null;//Avoid loading anything more
		}
		if(currentSearch != search.value) {
			//New search made in between, ignore this result
			return;
		}

		//Parse all results
		for (let i = 0; i < res[key].items.length; i++) {
			const t = res[key].items[i];
			let alreadySelected = false;
			switch(props.searchType) {
				default:
				case "track":
					if(!t.preview_url) continue;
					for (let j = 0; j < props.filteredItems.length; j++) {
						if(props.filteredItems[j].id == t.id) alreadySelected = true;
					}
					if(alreadySelected) continue;
					let trackData:TrackData = {
						id: t.id,
						name: t.name,
						artist: t.artists[0].name,
						album: t.album?.name,
						audioPath: t.preview_url,
						picture:t.album.images && t.album.images.length > 0? t.album.images[0].url : null,
						isPlaying:false,
					};
					items.push(trackData);
					break;

				case "playlist":
					// console.log("ADD", props.filteredItems);
					for (let j = 0; j < props.filteredItems.length; j++) {
						if(props.filteredItems[j].id == t.id) alreadySelected = true;
					}
					if(alreadySelected || t.tracks.total == 0) continue;
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
			showAutoComplete.value = items.length > 0;
		}
		nextTick().then(_=> {
			//Wait for component to be displayed to get proper size computation of the list
			list.populate(items);
			if(offset == 0) {
				list.scrollToIndex(0);
			}
			list.refreshItems();
		});
		offset += 50;
	}while(res[key].next && items.length < props.maxResult);
	showNoResult.value = items.length == 0;
	timeoutNoResult = setTimeout(_=> {
		showNoResult.value = false;
	}, 2000);
	loading.value = false;
}

/**
 * Called when searching for something
 */
watch(search, () => {
	if(search.value.length == 0) {
		showAutoComplete.value = false;
	}else{
		loading.value = true;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(()=>doSearch(), 200);
	}
});

/**
 * Renders an item of the auto complete list
 */
function renderItem(data:TrackData, index:number, holder:HTMLDivElement) {
	let clazz:Component = props.searchType == "track" ? SearchTrackResultItem : SearchPlaylistResultItem;
	//Rendering again on the same holder only updates the item's props
	let vnode = h(clazz, {data});
	vnode.appContext = appContext;
	render(vnode, holder);
	renderedHolders.add(holder);
}

/**
 * Called when an item is clicked on the list
 */
function onItemClicked(data:TrackData, index:number, holder:HTMLDivElement) {
	// let res = props.filteredItems.concat(data);
	showAutoComplete.value = false;
	let listData = list.data;
	for (let i = 0; i < listData.length; i++) {
		if(listData[i].id == data.id) {
			listData.splice(i, 1);
		}
	}
	list.populate(listData);
	// res = res.splice(Math.max(0, res.length - props.maxSelectable), props.maxSelectable);
	emit("select", data);
}

/**
 * Called when an item is destroyed
 */
function onItemDestroyed(holder:HTMLDivElement) {
	if(renderedHolders.has(holder)) {
		render(null, holder);
		renderedHolders.delete(holder);
	}
}

/**
 * Clears the current search
 */
function onClearSearch():void {
	search.value = "";
	showNoResult.value = false;
}

</script>

<style scoped lang="less">
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