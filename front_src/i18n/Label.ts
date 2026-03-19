export default class Labels {
	public static json:any = {
		en : {
			global: {
				yes:"Yes",
				no:"No",
				quit:"Quit",
				loading:"Loading...",
				online:"connected",
				offline:"not connected",
				noResult:"No result",
				back:"Back",
				playback:"Click anywhere to enable audio playback",
				copy: "Copy",
			},
			oAuth: {
				title:"You must grant access to your playlists to play Multi Blindtest",
				subtitle:"Don't worry, <strong>Multi Blindtest</strong> only requests for playlists <strong>read</strong> permission, it will never be able to change anything on your spotify account. And no personnal information will be stored.",
			},
			home : {
				title : "Multi Blindtest",
				subtitle : "- best source of headaches -",
				head : "Play up to 6 blind tests simultaneously",
				connectSpotify : "Connect with Spotify",
				demo : "Demo",
				solo : "Play solo",
				multi : "Multiplayer",
				twitch : "Play from Twitch",
				create : "Create from tracks",
				changelog : "See latest updates",
				footer : `
					Created by <a href="https://www.durss.ninja" target="_blank">Durss</a>. Get sources <a href="https://github.com/Durss/multiblindtest" target="_blank">on github</a><br />
					Based on <a href="https://www.youtube.com/watch?v=_dN0DpE0q3E" target="_blank">an idea</a> from <a href="https://twitter.com/navo_" target="_blank">Navo</a> &amp; <a href="https://twitter.com/kyank" target="_blank">Kyan Khojandi</a>.
				`,
			},
			demo: {
				title:"Demo",
				description:"Select the number of simultaneous tracks you want to be played",
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
				noTrack: "Following playlist(s) don't have any playable tracks",
				title: "Select playlists",
				subtitle: "Select playlists from which you want songs to be picked up randomly for your Multi Blindtest",
				refresh: "Refresh playlists",
				playableTracksInfos: "This playlist may contain more tracks than this, but Spotify only allows this number of tracks to be played from it.",
				playableTracks: "{count} playable tracks",
				owner: "By {owner}",
				search: "Search for a playlist:",
				deleteConfirm: "Delete this playlist ?",
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
				subtitle:"Select up to <strong>{tracksCount}</strong> tracks to create your own Multi Blindest and share it with your friends",
				search:{
					label:"Search for a song",
					placeholder:"Song title...",
				},
				selected:"Selected tracks",
				testBt:"Test",
				createBt:"Create",
				help: {
					title:"Not finding a track ?",
					description:`If you're not finding a track it's most probably because rightholders of the artist refuse their tracks from being played outside of Spotify.<br />
					Spotify API probably returns the track but doesn't provide the 30 seconds abstract MP3 necessary for the blindtest to work, in which case it won't be displayed on the search results.`,
				},
			},
			group: {
				lobby: {
					title: "Selected Playlists",
					players: "Players",
					join: "Join game",
					usernamePlaceholder: "Username...",
					wait:"Wait for <strong>{hostName}</strong> to start the game",
					start:"Start game",
					params:"Parameters",
					acceptAlbum:"Album name accepted",
					gamesCount:"Number of games",
					tracksCount:"Number of tracks",
					gameDuration:"Round duration (seconds)",
					handicap:"Handicap (seconds)",
					handicapInfos:"Musics will start {SECONDS} seconds later than the other players.",
					expertMode: {
						title:"Expert mode",
						details:"When enabled, orthographic tolerence will be slightly lowered and you can accept only track's title or artist's name",
						acceptTitle:"Title accepted",
						acceptArtist:"Artist name accepted",
						selectSomething: "Please select at least one option",
					},
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
					index:"Game {index}/{total}",
					giveup:"I pass",
					gaveup:"Passed",
					rank:"Scores",
					kicked:"You have been kicked out of the game",
					kickConfirm:{
						title:"Kick user?",
						description:"Do you really want to kick this player out of the game?",
					},
					notEnoughPlayers:"There is not enough users left on this game :(",
					serverReboot:"Oopsie 😬<br />The serveur just rebooted, hence, your game went to the Multi Blindtest paradise prematurely...<br />✝ RIP ✝",
					giveupConfirm: {
						title: "Give up ?",
						description: "If majority of the players give up, this game will be over and answers will be displayed.",
					},
					expertMode: {
						title:"Expert mode enabled",
						acceptTitle:"Title accepted",
						acceptArtist:"Artist accepted",
						refuseTitle:"Title refused",
						refuseArtist:"Artist refused",
					},
				}
			},
			twitch: {
				auth: {
					spotifyConnect:"Connect",
				},
				lobby: {
					maxPlayers:"Max players",
					zoomLevel:"Interface scale",
					multipleWins:"Multiple winners",
					acceptDurationDetails:"If this value is set above 0, once a player finds a track, other players will have this number of seconds to also find the track and earn points.",
					acceptDuration:"Accept answers duration (seconds)",
					chatConfirm:"Confirm good guesses on chat",
					chatConfirmTT:"When someone finds a song a message a message will be sent in the chat with your account's name to alert her/him.<br />This can be usefull to compensate the stream delay issues.",
				},
				game: {
					index:"Round",
					results:"Results",
					confirmChat:"Congrats @{USER} you guessed SingsNote {TITLE} by SingsMic {ARTIST}",
				},
				viewer: {
					selectedPlaylists:"Selected playlist | Selected playlists"
				}
			},
			game: {
				hidden: "???",
				guess: "Guess a track :",
				guessPlaceholder: "title OR artist...",
				stopTrack: "Stop this track",
				loadingMP3:"Loading tracks...",
				loadError:"TRACK LOADING FAILED",
				answerForm: {
					show: "Show answers",
					share: "Share this mix",
					chat: "<center>Send chat message.<br /><i>(CTRL+Enter)</i></center>",
				},
				newDemo:"New demo",
				newGame:"Play again",
				createGame:"Create a Multi Blindtest",
				noPlaylists:"The requested playlist(s) haven't been found, you may have deleted them ?",
			},


			changelog: {
				title:"Latest updates",
				logs: [
					{
						date:"03/19/2025",
						updates: [
							"Fixed broken Twitch overlay",
						]
					},
					{
						date:"12/05/2025",
						updates: [
							"Migration to the new Spotify authentication system after the old one was deprecated",
						]
					},
					{
						date:"01/01/2025",
						updates: [
							"Fixing Twitch session failing to start",
						]
					},
					{
						date:"12/01/2024",
						updates: [
							"Updating Twtich auth after the external service died",
						]
					},
					{
						date:"06/03/2021",
						updates: [
							"Adding \"multiple winners\" mode for twitch so multiple users can earn point by finding the same song",
						]
					},
					{
						date:"04/13/2021",
						updates: [
							"Adding possibility to accept album's names",
							"Slightly enhanced answers check",
							"New options for twitch to confirm good guesses with a chat message",
						]
					},
					{
						date:"03/10/2021",
						updates: [
							"Adding Twitch mode via OBS",
							"Removing Twitch extension after Twitch refused it :'(",
						]
					},
					{
						date:"01/27/2021",
						updates: [
							"Adding timer on multiplayer mode",
							"A twitch extension has been created, low chances it gets validated by twitch but i can add anyone as tester in the meantime. <a href=\"https://www.durss.ninja/#about\" target=\"_blank\">Contact me</a> if you're interested !",
						]
					},
					{
						date:"11/18/2020",
						updates: [
							"Adding possibility to kick a player out of the game",
						]
					},
					{
						date:"11/08/2020",
						updates: [
							"Adding possibility to replay a track on multiplayer mode",
							"Adding possibility to update our multiplayer's nickname",
						]
					},
					{
						date:"05/13/2020",
						updates: [
							"Adding a chat to multiplayer mode",
							"Slightly reducing spelling tolerance",
							"Minor UI tweaks on mobile",
						]
					},
					{
						date:"04/30/2020",
						updates: [
							"Adding possibility to search for playlists.",
						]
					},
					{
						date:"04/29/2020",
						updates: [
							"Adding an \"handicap\" option to the multiplayer mode. This will make the countdown last X seconds more for a user.",
						]
					},
					{
						date:"04/25/2020",
						updates: [
							"Adding an \"Expert Mode\" to the multiplayer mode",
						]
					},
					{
						date:"04/24/2020",
						updates: [
							"New multiplayer mode",
							"French translation added (language selected from browser's default language)",
							"Making interface clearer",
						]
					},
					{
						date:"01/27/2020",
						updates: [
							"Possibility to change number of simultaneous tracks",
							"New demo mode to try out without connecting to spotify",
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
				quit:"Retour",
				loading:"Chargement...",
				online:"connecté",
				offline:"déconnecté",
				noResult:"Aucun résultat",
				back:"Retour",
				playback:"Clique n'importe où pour autoriser la lecture",
			},
			oAuth: {
				title:"Pour jouer au Multi Blindtest vous devez autoriser l'accès à vos playlists",
				subtitle:"Pas d'inquiétude, <strong>Multi Blindtest</strong> n'a besoin que d'une permission de <strong>lecture</strong> et ne pourra jamais modifier quoi que ce soit sur votre compte Spotify. Aucune donnée personnelle ne sera stockée.",
			},
			home : {
				title : "Multi Blindtest",
				subtitle : "- Pour un mal de crâne garanti -",
				head : "Joue jusqu'à 6 blindtests en simultané !",
				connectSpotify : "Connexion via Spotify",
				demo : "Demo",
				solo : "Partie solo",
				multi : "Multijoueur",
				twitch : "Jouer depuis Twitch",
				create : "Créer un mix",
				changelog : "Voir les dernières mises à jour",
				footer : `
					Créé par <a href="https://www.durss.ninja" target="_blank">Durss</a>. Sources <a href="https://github.com/Durss/multiblindtest" target="_blank">sur github</a><br />
					Basé sur <a href="https://www.youtube.com/watch?v=_dN0DpE0q3E" target="_blank">une idée</a> de <a href="https://twitter.com/navo_" target="_blank">Navo</a> &amp; <a href="https://twitter.com/kyank" target="_blank">Kyan Khojandi</a>.
				`,
			},
			demo: {
				title:"Demo",
				description:"Sélectionne le niveau de difficulté que tu souhaites. Ceci correspond au nombre de morceaux joués en simultané",
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
				noTrack: "Les playlists suivantes ne possèdent pas de morceaux jouables",
				title: "Sélectionne des playlists",
				subtitle: "Sélectionne les playlists dans lesquelles piocher des morceaux aléatoirement",
				refresh: "Rafraîchir la liste",
				playableTracksInfos: "Cette playlist contient peut-être plus de morceaux que cela mais Spotify ne permet d'en jouer que ce nombre là.",
				playableTracks: "{count} morceaux jouables",
				owner: "Par {owner}",
				search: "Chercher une playlist :",
				deleteConfirm: "Supprimer cette playlist ?",
				footer: {
					playlistCount: "{count} playlist(s)",
					tracksCount: "{count} morceau(x)",
					notEnough: "Sélectionne au moins 20 morceaux",
					start: "Jouer",
					difficulty: "Difficulté <i>(nombre de morceaux simultanés)</i> :",
				}
			},
			create: {
				title:"Créer un Multi Blindtest",
				subtitle:"Sélectionne jusqu'à <strong>{tracksCount}</strong> morceaux pour créer ton Multi Blindest et le partager à tes amis",
				search:{
					label:"Chercher un morceau",
					placeholder:"Titre...",
				},
				selected:"Morceaux sélectionnés",
				testBt:"Tester",
				createBt:"Créer",
				help: {
					title:"Vous ne trouvez pas un morceau ?",
					description:`Si vous ne trouvez pas un morceau, c'est probablement parce que ses ayant-droits refusent qu'ils soit joué en dehors de Spotify.<br />
					L'API Spotify renvoie probablement le morceau mais sans fournir un MP3 de 30s d'extrait nécessaire au fonctionnement du blindtest, auquel cas il ne sera pas affiché dans les résultats de recherche.`,
				},
			},
			group: {
				lobby: {
					title: "Playlists sélectionnées",
					players: "Joueurs",
					join: "Rejoindre la partie",
					usernamePlaceholder: "Pseudo...",
					wait:"Attends que <strong>{hostName}</strong> lance la partie",
					start:"Démarrer",
					params:"Paramètres",
					acceptAlbum:"Nom de l'album accepté",
					gamesCount:"Nombre de manches",
					tracksCount:"Nombre de morceaux",
					gameDuration:"Durée d'une manche (secondes)",
					handicap:"Handicap (secondes)",
					handicapInfos:"Ses musiques commenceront {SECONDS} secondes après les autres.",
					expertMode: {
						title:"Mode expert",
						details:"Le mode expert réduit légèrement la tolérence orthographique des réponses et vous pouvez choisir de n'accepter que le titre ou l'artiste du morceau",
						acceptTitle:"Accepter le titre",
						acceptArtist:"Accepter l'artiste",
						selectSomething: "Sélectionnez au moins une option",
					},
					share: {
						title: "Inviter des ami·e·s :",
						copied: "Lien copié",
						send: "Envoie ce lien :",
						copy: "Copier",
					},
				},
				game: {
					index:"Manche {index}/{total}",
					next:"Manche suivante",
					new:"Nouvelle partie",
					complete:"Partie terminée",
					wait:"Attends que <strong>{hostName}</strong> lance la manche suivante",
					giveup:"Passer mon tour",
					gaveup:"A passé",
					rank:"Classement",
					kicked:"Tu as été kické de la partie",
					kickConfirm:{
						title:"Kick ?",
						description:"Veux-tu éjecter cette personne de la partie ?",
					},
					notEnoughPlayers:"Il n'y a plus assez de joueur·se dans la partie :(",
					serverReboot:"Oups 😬<br />Le serveur vient de redémarrer. La partie en cours a ainsi rejoint le paradis des Multi Blindtest prématurément...<br />✝ RIP ✝",
					giveupConfirm: {
						title: "Passer ton tour ?",
						description: "Si la majorité des joueurs passent, la manche sera terminée et les réponses affichées.",
					},
					expertMode: {
						title:"Mode expert activé",
						acceptTitle:"Titre accepté",
						acceptArtist:"Artiste accepté",
						refuseTitle:"Titre refusé",
						refuseArtist:"Artiste refusé",
					},
				}
			},
			twitch: {
				auth: {
					spotifyConnect:"Connexion",
				},
				lobby: {
					maxPlayers:"Joueurs max",
					zoomLevel:"Taille de l'interface",
					multipleWins:"Multiple gagnants",
					acceptDurationDetails:"Si cette valeur est suppérieur à 0, lorsqu'un joueur trouve un morceau, les autres auront ce nombre de secondes pour également le trouver.",
					acceptDuration:"Durée de réponse (seconds)",
					chatConfirm:"Confirmer les bonnes réponses<br/>dans le chat",
					chatConfirmTT:"Lorsque quelqu'un trouve une bonne réponse un message sera automatiquement envoyé en votre nom dans le chat pour la/le prévenir.<br/>Ceci peut-être utile pour palier aux problèmes de latence du stream.",
				},
				game: {
					index:"Manche",
					results:"Resultats",
					confirmChat:"Bravo @{USER} tu as trouvé SingsNote {TITLE} par SingsMic {ARTIST}",
				},
				viewer: {
					selectedPlaylists:"Playlist sélectionnée | Playlists sélectionnées"
				}
			},
			game: {
				hidden: "???",
				guess: "Faire une proposition :",
				guessPlaceholder: "titre OU artiste...",
				stopTrack: "Arrêter ce morceau",
				loadingMP3:"Chargement des musiques...",
				loadError:"ERREUR DE CHARGEMENT",
				answerForm: {
					show: "Voir les réponses",
					share: "Partager ce mix",
					chat: "Envoyer toutes les réponses dans le chat.<br />Si désactivé, <i>CTRL+Entrée</i> permet tout de même d'envoyer votre message dans le chat",
				},
				newDemo:"Nouvelle demo",
				newGame:"Rejouer",
				createGame:"Créer un Multi Blindtest",
				noPlaylists:"Aucune des playlists demandées n'a été trouvée. Peut-être les as-tu supprimées entre temps ?",
			},

			changelog: {
				title:"Mises à jour",
				logs: [
					{
						date:"19/03/2025",
						updates: [
							"Correction de l'overlay Twitch qui était cassé",
						]
					},
					{
						date:"05/12/2025",
						updates: [
							"Migration vers le nouveau système d'authentification Spotify après la dépréciation de l'ancien",
						]
					},
					{
						date:"01/01/2025",
						updates: [
							"Correction d'un bug empêchant de lancer des parties via Twitch",
						]
					},
					{
						date:"01/12/2024",
						updates: [
							"Mise à jour de l'authentification Twitch suite à la fin de vie du service externe utilisé jusque là",
						]
					},
					{
						date:"03/06/2021",
						updates: [
							"Ajout d'un mode \"Plusieurs gagnants\" pour twitch permettant à plusieurs joueurs de trouver un seul et même morceau",
						]
					},
					{
						date:"13/04/2021",
						updates: [
							"Ajout de la possibilité d'accepter le nom des albums",
							"Légère amélioration de la validation des réponses",
							"Ajout d'une nouvelle option twitch pour confirmer directement dans le chat lorsque quelqu'un trouve une bonne réponse",
						]
					},
					{
						date:"10/03/2021",
						updates: [
							"Ajout d'un mode twitch via OBS",
							"Suppression de l'extension Twitch suite à son refus par Twitch :'(",
						]
					},
					{
						date:"27/01/2021",
						updates: [
							"Ajout d'un timer au mode multi joueur",
							"Une extension Twitch a été créée, peu de chances que Twitch la valide mais je peux ajouter n'importe qui à la liste des testeurs. <a href=\"https://www.durss.ninja/#about\" target=\"_blank\">Contactez moi</a> si ça vous intéresse !",
						]
					},
					{
						date:"18/11/2020",
						updates: [
							"Ajout de la possibilité de kicker un joueur de la partie",
						]
					},
					{
						date:"08/11/2020",
						updates: [
							"Ajout de la possibilité de rejouer les morceaux d'une manche multijoueur",
							"Ajout de la possiblité d'éditer notre pseudo en mode multijoueur",
						]
					},
					{
						date:"13/05/2020",
						updates: [
							"Ajout d'un chat dans le mode multi joueur",
							"Légère réduction de la tolérance orthographique",
							"Petites améliorations de mise en page sur mobile",
						]
					},
					{
						date:"30/04/2020",
						updates: [
							"Ajout de la possibilité de chercher des playlists.",
						]
					},
					{
						date:"29/04/2020",
						updates: [
							"Ajout d'une option \"handicap\" au mode multijoueur, permettant de faire durer le décompte X secondes de plus pour un·e joueur·se.",
						]
					},
					{
						date:"25/04/2020",
						updates: [
							"Ajout d'un \"Mode Expert\" au mode multijoueur",
						]
					},
					{
						date:"24/04/2020",
						updates: [
							"Nouveau mode multijoueur",
							"Interface traduite en Français (langue sélectionnée en fonction de la langue par défaut du nvigateur)",
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