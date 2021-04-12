import Api from '@/utils/Api';
import ChangeLog from '@/views/ChangeLog.vue';
import DemoConfig from '@/views/DemoConfig.vue';
import GameView from '@/views/GameView.vue';
import GroupGame from '@/views/GroupGame.vue';
import GroupLobby from '@/views/GroupLobby.vue';
import Home from '@/views/Home.vue';
import MixCreator from '@/views/MixCreator.vue';
import OAuth from '@/views/OAuth.vue';
import PlaylistSelector from '@/views/PlaylistSelector.vue';
import TwitchAuth from '@/views/twitch/common/TwitchAuth.vue';
import TwitchBroadcaster from '@/views/twitch/common/broadcaster/TwitchBroadcaster.vue';
import TwitchBroadcasterControls from '@/views/twitch/common/broadcaster/TwitchBroadcasterControls.vue';
import TwitchExtensionConfiguration from '@/views/twitch/extension/TwitchExtensionConfiguration.vue';
import TwitchIntro from '@/views/twitch/common/TwitchIntro.vue';
import TwitchViewer from '@/views/twitch/extension/viewer/TwitchViewer.vue';
import TwitchExtension from '@/views/twitch/extension/TwitchExtension.vue';
import TwitchOBS from '@/views/twitch/obs/TwitchOBS.vue';
import TwitchLobby from '@/views/twitch/TwitchLobby.vue';
import Vue from 'vue';
import VueRouter, { Route, RouterMode } from 'vue-router';

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: 'home',
		props:true,
		meta: {
			hideHomeBt:true,
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
			demo:true,
			needAuth:false,
			tag:{
				path:"/demo",
				title:"Demo config"
			}
		},
		component: DemoConfig
	},
	{
		path: '/demo/:trackscounts',
		name: 'demo/play',
		props:true,
		meta: {
			demo:true,
			needAuth:false,
			tag:{
				path:"/demo/play",
				title:"Demo play"
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
			hideHomeBt:true,
			needAuth:false,
		}
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
		path: '/group/:id?',
		name: 'group',
		props:true,
		meta: {
			needGroupAuth:true,
			tag:{
				path:"/group",
				title:"multiplayer lobby"
			}
		},
		component: GroupLobby
	},
	{
		path: '/group/:id/restart',
		name: 'groupRestart',
		props:true,
		meta: {
			needGroupAuth:true,
			restartMode:true,
			tag:{
				path:"/group/restart",
				title:"restart group game"
			}
		},
		component: GroupLobby,
		beforeEnter: async (to:Route, from, next) =>{
			let roomId = to.params.id;
			let res = await Api.post("group/restart", {roomId});
			next();
		},
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
		path: '/changelog',
		name: 'changelog',
		meta: {
			tag:{
				path:"/changelog",
				title:"changelog"
			}
		},
		component: ChangeLog
	},
	{
		path: "*",
		redirect:{name:"home"},
	},





	{
		path: '/twitch',
		name: 'twitch',
		props:true,
		meta: {
			hideHomeBt:false,
		},
		component: TwitchIntro
	},
	{
		path: '/twitch/auth/:twitchOAToken?/:spotifyOAToken?',
		name: 'twitch/auth',
		component: TwitchAuth,
		props:true,
		meta: {
			needAuth:false,
		}
	},
	{
		path: '/twitch/lobby/:mode/:playlistids',
		name: 'twitch/lobby',
		props:true,
		meta: {
			hideHomeBt:false,
			needSocket:true,
		},
		component: TwitchLobby
	},
	{
		path: '/twitch/controls/:mode/:playlistids/:tracksCount/:gamesCount/:gameDuration/:acceptAlbum/:expertMode?',
		name: 'twitch/controls',
		props:true,
		meta: {
			needSocket:true,
		},
		component: TwitchBroadcasterControls
	},
	{
		path: "/twitch/config",
		name: "twitch/config",
		props:true,
		meta: {
			hideHomeBt:true,
		},
		component: TwitchExtensionConfiguration
	},
	{
		path: '/twitchextension',
		name: 'twitchext',
		meta: {
			hideHomeBt:true,
			needsTwitchHelper:true,
			needSocket:true,
		},
		component: TwitchExtension,
		children: [
			{
				path: "broadcaster",
				name: "twitchext/broadcaster",
				props:true,
				components: {
					twitch:TwitchBroadcaster
				},
			},
			{
				path: "viewer/:isBroadcaster?",
				name: "twitchext/viewer",
				props:true,
				components: {
					twitch:TwitchViewer
				},
			},
		]
	},
	{
		path: '/twitchobs',
		name: 'twitchobs',
		component: TwitchOBS,
		meta: {
			needSocket:true,
			obsMode:true,
		},
		children: [
			{
				path: "broadcaster",
				name: "twitchobs/broadcaster",
				props:true,
				components: {
					twitch:TwitchBroadcaster
				},
			},
			{
				path: "viewer/:twitchLogin",
				name: "twitchobs/viewer",
				props:true,
				meta: {
					hideHomeBt:true,
				},
				components: {
					twitch:TwitchViewer
				},
			},
		]
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

let router;
export function initRouter(mode:RouterMode):VueRouter {
	router = new VueRouter({
		mode:mode,
		routes:routes
	});
	return router;
}

export default function getRouter():VueRouter {
	return router;
}