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
		meta: {
			tag:{
				path:"/",
				title:"Home"
			}
		},
		component: Home
	},
	{
		path: '/demo',
		name: 'demo',
		props:true,
		meta: {
			needAuth:false,
			tag:{
				path:"/demo",
				title:"Demo"
			}
		},
		component: MultiPlayer
	},
	{
		path: '/player/playlists/:playlistids',
		name: 'player/playlists',
		props:true,
		meta: {
			needAuth:true,
			tag:{
				path:"/player/playlists",
				title:"Play playlist"
			}
		},
		component: MultiPlayer
	},
	{
		path: '/player/tracks/:tracksids',
		name: 'player/tracks',
		props:true,
		meta: {
			needAuth:true,
			tag:{
				path:"/player/tracks",
				title:"Play tracks"
			}
		},
		component: MultiPlayer
	},
	{
		path: '/oauth',
		name: 'oauth',
		component: OAuth,
		props:true,
		meta: {
			needAuth:false,
		}
	},
	{
		path: '/playlists',
		name: 'playlists',
		meta: {
			needAuth:true,
			tag:{
				path:"/playlists",
				title:"Playlist selector"
			}
		},
		component: PlaylistSelector
	},
	{
		path: '/create',
		name: 'create',
		meta: {
			needAuth:true,
			tag:{
				path:"/create",
				title:"Create mix"
			}
		},
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
