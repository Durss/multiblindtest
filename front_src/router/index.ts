import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'
import OAuth from '@/views/OAuth.vue'
import GroupGame from '@/views/GroupGame.vue';
import GroupLoby from '@/views/GroupLoby.vue';
import MixCreator from '@/views/MixCreator.vue';
import GameView from '@/views/GameView.vue';
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
		component: GameView
	},
	{
		path: '/player/playlists/:playlistids/:trackscounts?',
		name: 'player/playlists',
		props:true,
		meta: {
			needAuth:true,
			tag:{
				path:"/player/playlists",
				title:"Play playlist"
			}
		},
		component: GameView
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
		component: GameView
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
		path: '/playlists/:mode',
		name: 'playlists',
		props:true,
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
		path: '/group/:id?',
		name: 'group',
		props:true,
		meta: {
			needGroupAuth:true,
			tag:{
				path:"/group",
				title:"multiplayer loby"
			}
		},
		component: GroupLoby
	},
	{
		path: '/group/:id/play',
		name: 'group/play',
		props:true,
		meta: {
			needGroupAuth:true,
			tag:{
				path:"/group/play",
				title:"multiplayer play"
			}
		},
		component: GroupGame
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
