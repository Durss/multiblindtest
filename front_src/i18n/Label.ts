export default class Labels {
	public static json:any = {
		en : {
			global: {
				yes:"Yes",
				no:"No",
				quit:"Quitter",
			},
			oAuth: {
				title:"You must grant access to your playlists to play Multi Blindtest",
				subtitle:"Don't worry, <strong>Multi Blindtest</strong> only requests for playlists <strong>read</strong> permission, it will never be able to change anything on your spotify account. And no personnal information will be stored.",
			},
			home : {
				title : "Multi Blindtest",
				subtitle : "- try not to vomit -",
				head : "It's like playing <strong>{tracksCount}</strong> blind tests simultaneously, awful.",
				connectSpotify : "Connect with Spotify",
				demo : "Demo",
				solo : "Play solo",
				multi : "Multiplayer",
				create : "Create from tracks",
				changelog : "See latest updates",
				footer : `
					Created by <a href="https://www.durss.ninja" target="_blank">Durss</a>. Get sources <a href="https://github.com/Durss/multiblindtest" target="_blank">on github</a><br />
					Based on <a href="https://www.youtube.com/watch?v=_dN0DpE0q3E" target="_blank">an idea</a> from <a href="https://twitter.com/navo_" target="_blank">Navo</a> &amp; <a href="https://twitter.com/kyank" target="_blank">Kyan Khojandi</a>.
				`,
			},
			playlists : {
				loading: {
					title :"Loading your playlists",
					description :"This operation may take a while depending on the number of playlists and songs you have as it's scanning for all the song that spotify actually allows to be played",
				},
				noPlaylist : {
					head : "You have no playlist available on your Spotify account. Create one or subscribe to some then click <strong>{refresh}</strong> button above.",
					suggestion : "Here are some suggestions you can subscribe to :",
				},
				noTrack :"Following playlist(s) don't have enough playable tracks",
				title: "Select playlists",
				subtitle: "Select playlists from which you want songs to be picked up randomly for your Multi Blindtest",
				refresh: "Refresh playlists",
				playableTracksInfos: "Your playlist may contain more tracks than this, but Spotify only allows this number of tracks to be played from it.",
				playableTracks: "{count} playable tracks",
				owner: "By {owner}",
				footer: {
					playlistCount: "{count} playlist(s)",
					tracksCount: "{count} track(s)",
					notEnough: "Select at least 20 tracks",
					start: "Start",
					difficulty: "Difficulty <i>(number of simultaneous tracks)</i> :",
				}
			},
			create: {
				title:"Create a Multi Blindtest",
				subtitle:"Select up to <strong>{tracksCount}</strong> tracks to create your own Multi Blindest",
				search:{
					label:"Search for a song",
					placeholder:"Song title...",
				},
				selected:"Selected tracks",
				testBt:"Test",
				createBt:"Create",
			},
			group: {
				loby: {
					title: "Selected Playlists",
					players: "Players",
					join: "Join game",
					usernamePlaceholder: "Username...",
					wait:"Wait for <strong>{hostName}</strong> to start the game",
					start:"Start game",
					params:"Parameters",
					gamesCount:"Number of games",
					tracksCount:"Number of tracks",
					share: {
						title: "Invite friends :",
						copied: "Link copied to clipboard",
						send: "Send this link :",
						copy: "Copy",
					},
				},
				game: {
					next:"Next game",
					new:"New game",
					complete:"Game finished",
					wait:"Wait for <strong>{hostName}</strong> to start next game",
					index:"Manche {index}/{total}",
				}
			},
			game: {
				hidden: "???",
				guess: "Guess a track :",
				guessPlaceholder: "title OR artist...",
				stopTrack: "Stop this track",
				answerForm: {
					show: "Show answers",
					share: "Share this mix",
				},
				newDemo:"New demo",
				newGame:"New Multi Blindtest",
				createGame:"Create a Multi Blindtest",
			},


			changelog: {
				title:"Latest updates",
				logs: [
					{
						date:"04/24/2020",
						updates: [
							"New multiplayer mode",
							"Making interface clearer",
						]
					},
					{
						date:"01/27/2020",
						updates: [
							"Possibility to change number of simultaneous tracks",
							"New demo mode to try out with connecting to spotify",
						]
					},
					{
						date:"01/22/2020",
						updates: [
							"First version online !",
						]
					}
				],
			},
		},





		
		fr : {
			global: {
				yes:"Oui",
				no:"Non",
			},
			oAuth: {
				title:"Pour jouer au Multi Blindtest vous devez autoriser l'accès à vos playlists",
				subtitle:"Pas d'inquiétude, <strong>Multi Blindtest</strong> n'a besoin que d'une permission de <strong>lecture</strong>et ne pourra jamais modifier quoi que ce soit sur votre compte Spotify. Aucune donnée personnelle ne sera stockée.",
			},
			home : {
				title : "Multi Blindtest",
				subtitle : "- Pour un mal de crâne garanti -",
				head : "C'est comme jouer à <strong>{tracksCount}</strong> blindtests en simultané",
				connectSpotify : "Connexion via Spotify",
				demo : "Demo",
				solo : "Partie solo",
				multi : "Multijoueur",
				create : "Créer un mix",
				changelog : "Voir les dernières mises à jour",
				footer : `
					Créé par <a href="https://www.durss.ninja" target="_blank">Durss</a>. Sources <a href="https://github.com/Durss/multiblindtest" target="_blank">sur github</a><br />
					Basé sur <a href="https://www.youtube.com/watch?v=_dN0DpE0q3E" target="_blank">une idée</a> de <a href="https://twitter.com/navo_" target="_blank">Navo</a> &amp; <a href="https://twitter.com/kyank" target="_blank">Kyan Khojandi</a>.
				`,
			},
			playlists : {
				loading: {
					title :"Chargement de vos playlists",
					description :"Cette opération peut prendre du temps selon le nombre de playlists et de morceaux que vous possédez. Tous les morceaux sont scannés pour vérifier que Spotify permet leur lecture.",
				},
				noPlaylist : {
					head : "Vous n'avez aucune playlist disponible dans Spotify. Créez-en ou abonnez-vous à des playlists existantes puis cliquez sur <strong>{refresh}</strong> au-dessus.",
					suggestion : "Voici quelques suggestions de playlists auxquelles vous abonner",
				},
				noTrack :"Les playlists suivantes ne possèdent pas assez de mirceaux jouables",
				title: "Sélectionne des playlists",
				subtitle: "Sélectionnez les playlists dans lesquelles piocher des morceaux aléatoirement pour votre Multi Blindtest",
				refresh: "Rafraîchir la liste",
				playableTracksInfos: "Votre playlist contient peut-être plus de morceaux que cela mais Spotify ne permet d'en jouer que ce nombre là.",
				playableTracks: "{count} morceaux jouables",
				owner: "Par {owner}",
				footer: {
					playlistCount: "{count} playlist(s)",
					tracksCount: "{count} morceau(x)",
					notEnough: "Sélectionnez au moins 20 morceaux",
					start: "Jouer",
					difficulty: "Difficulté <i>(nombre de morceaux simultanés)</i> :",
				}
			},
			create: {
				title:"Créer un Multi Blindtest",
				subtitle:"Sélectionne jusqu'à <strong>{tracksCount}</strong> morceaux pour créer ton Multi Blindest",
				search:{
					label:"Chercher un morceau",
					placeholder:"Titre...",
				},
				selected:"Morceaux sélectionnés",
				testBt:"Tester",
				createBt:"Créer",
			},
			group: {
				loby: {
					title: "Playlists sélectionnées",
					players: "Joueurs",
					join: "Rejoindre la partie",
					usernamePlaceholder: "Pseudo...",
					wait:"Attendez que <strong>{hostName}</strong> lance la partie",
					start:"Démarrer",
					params:"Paramètres",
					gamesCount:"Nombre de manches",
					tracksCount:"Nombre de morceaux",
					share: {
						title: "Inviter des ami·e·s :",
						copied: "Lien copié",
						send: "Envoie ce lien :",
						copy: "Copier",
					},
				},
				game: {
					index:"Manche {index}/{total}",
					next:"Partie suivante",
					new:"Nouvelle partie",
					complete:"Partie terminée",
					wait:"Attendez que <strong>{hostName}</strong> lance la partie suivante",
				}
			},
			game: {
				hidden: "???",
				guess: "Faire une proposition :",
				guessPlaceholder: "title OU artiste...",
				stopTrack: "Arrêter ce morceau",
				answerForm: {
					show: "Voir les réponses",
					share: "Partager ce mix",
				},
				newDemo:"Nouvelle demo",
				newGame:"Nouveau Multi Blindtest",
				createGame:"Créer un Multi Blindtest",
			},

			changelog: {
				title:"Mises à jour",
				logs: [
					{
						date:"24/04/2020",
						updates: [
							"Nouveau mode multijoueur",
							"Mises à jour de l'interface pour la rendre plus claire",
						]
					},
					{
						date:"27/01/2020",
						updates: [
							"Possibilité de changer le nombre de morceaux joués simultanément",
							"Nouveau mode demo pour tester sans se connecter à spotify",
						]
					},
					{
						date:"22/01/2020",
						updates: [
							"Première version en ligne",
						]
					}
				]
			},
		},
	}
}