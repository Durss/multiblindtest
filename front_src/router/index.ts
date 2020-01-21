import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'
import OAuth from '@/views/OAuth.vue'
import MixCreator from '@/views/MixCreator.vue';
import MultiPlayer from '@/views/MultiPlayer.vue';
import PlaylistSelector from '@/views/PlaylistSelector.vue';

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: 'home',
		props:true,
		component: Home
	},
	{
		path: '/player/playlists/:playlistids',
		name: 'player/playlists',
		props:true,
		meta: {needAuth:true},
		component: MultiPlayer
	},
	{
		path: '/player/tracks/:tracksids',
		name: 'player/tracks',
		props:true,
		meta: {needAuth:true},
		component: MultiPlayer
	},
	{
		path: '/oauth',
		name: 'oauth',
		component: OAuth
	},
	{
		path: '/playlists',
		name: 'playlists',
		meta: {needAuth:true},
		component: PlaylistSelector
	},
	{
		path: '/create',
		name: 'create',
		meta: {needAuth:true},
		component: MixCreator
	},
	{
		path: "*",
		redirect:{name:"home"},
	},
	{
		path: '/redirect',
		name: 'redirect',
		beforeEnter(to) {
			//@ts-ignore
			window.location.href = to.query.uri;
		}
	},
]

const router = new VueRouter({
	mode: "history",
	routes
})

export default router
