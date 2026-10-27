<template>
	<div class="twitchauth">
		<BouncingLoader v-if="loading" class="loader" :icon="getIcon('twitch')" :label="t('twitch.auth.connecting')" />

		<div v-if="!loading">
			<h1 v-if="!needSpotifyAuth && !loggedIn">{{ t('twitch.auth.title') }}</h1>
			<h1 v-if="!needSpotifyAuth && loggedIn">{{ t('twitch.auth.embedTitle') }}</h1>

			<div class="step" v-if="!loggedIn">
				<div class="head">{{ t('twitch.auth.tokenHead') }}</div>
				<Button type="button" :title="t('twitch.auth.generateToken')" :icon="getIcon('twitch')" :loading="authenticating"
					@click="clickGenerate()" />
			</div>

			<div class="step" v-if="loggedIn && urlOBS">
				<ToggleBlock class="block" :enabled="false" :icon="getIcon('obs')" :title="t('twitch.auth.playOnOBS')">
					<div>{{ t('twitch.obs.configureUrl') }}</div>
					<div class="url" ref="url">
						<div class="text" @click="selectText">{{ urlOBS }}</div>
						<Button :title="t('global.copy')" :icon="getIcon('copy')" highlight @click="copyURL()" />
					</div>
					<Button :to="{ name: 'playlists', params: { mode: 'twitchObs' } }" :title="t('twitch.auth.startSession')"
						:icon="getIcon('play')" />
				</ToggleBlock>

				<ToggleBlock class="block" :closed="true" :icon="getIcon('dmca')" :title="t('twitch.auth.dmca.title')">
					<div class="dmca">
						<!-- <div>The music won't be played on your stream but from within the extension so it will be undetectable by any live DMCA detection and your VOD won't have any trace of the audio.</div> -->
						<div>{{ t('twitch.auth.dmca.noLiveDmca') }}</div>
						<div>{{ t('twitch.auth.dmca.vod') }}</div>
						<div>{{ t('twitch.auth.dmca.learn') }}</div>
						<Button href="https://www.youtube.com/watch?v=7vd1EyQXq7A" type="link"
							:title="t('twitch.auth.dmca.tutorial')" target="_blank" :icon="getIcon('twitch')" />
						<div>{{ t('twitch.auth.dmca.multipleTracks') }}</div>
					</div>
				</ToggleBlock>
			</div>

			<div v-if="needSpotifyAuth" class="spotifyConnect">
				<h1>{{ t('twitch.auth.spotifyTitle') }}</h1>
				<div v-if="spotifyExpired">{{ t('twitch.auth.spotifyExpired') }}</div>
				<div v-if="!spotifyExpired">{{ t('twitch.auth.spotifyNeeded') }}</div>
				<Button :title="t('twitch.auth.spotifyConnect')" :to="{ name: 'redirect', query: { uri: spotifyAuthUrl } }"
					:icon="getIcon('spotify')" class="button" big />
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import BouncingLoader from "@/components/BouncingLoader.vue";
import Button from "@/components/Button.vue";
import ToggleBlock from "@/components/ToggleBlock.vue";
import { useStoreMain } from "@/store";
import Store from "@/store/Store";
import IRCClient from "@/twitch/IRCClient";
import TwitchUtils, { TwitchAuthToken } from "@/twitch/TwitchUtils";
import Config from "@/utils/Config";
import { getIcon } from "@/utils/Icons";
import SpotifyAPI from "@/utils/SpotifyAPI";
import Utils from "@/utils/Utils";
import gsap from "gsap";
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const props = withDefaults(defineProps<{
	twitchOAToken?: string;
	spotifyOAToken?: string;
}>(), {
	twitchOAToken: null,
	spotifyOAToken: null,
});

const { t } = useI18n();
const router = useRouter();
const storeMain = useStoreMain();

const url = useTemplateRef<HTMLDivElement>("url");

const loading = ref<boolean>(false);
const authenticating = ref<boolean>(false);
const checkingToken = ref<boolean>(false);
const error = ref<boolean>(false);
const errorIRC = ref<boolean>(false);
const loggedIn = ref<boolean>(false);
const needSpotifyAuth = ref<boolean>(false);
const spotifyExpired = ref<boolean>(false);
const token = ref<TwitchAuthToken | null>(null);
const urlOBS = ref<string | null>(null);
const spotifyAuthUrl = ref<string | null>(null);

const twitchExtUrl = computed((): string => { return Config.TWITCH_EXT_URL; });

onMounted(async () => {
	loading.value = true;
	Store.set("redirect", document.location.origin + router.resolve({ name: 'twitch/auth' }).href);
	spotifyAuthUrl.value = await SpotifyAPI.instance.getAuthUrl();
	loading.value = false;
	let currentToken: any = storeMain.twitchOAuthToken;
	if (props.twitchOAToken) {
		currentToken = props.twitchOAToken;
	}
	if (currentToken) {
		token.value = currentToken;
		let success = await submitToken();
		if (!success) {
			loading.value = false;
			error.value = false;
			errorIRC.value = false;
		}
	}
});

async function submitToken(): Promise<boolean> {
	error.value = false;
	errorIRC.value = false;
	checkingToken.value = true;
	let json = await TwitchUtils.validateToken(token.value.access_token);
	if (!json) {
		error.value = true;
	} else {
		let twitchLogin = json.login;
		loading.value = true;
		storeMain.setTwitchOAuthToken(token.value);
		storeMain.setTwitchLogin(twitchLogin);
		let res;
		try {
			res = await IRCClient.instance.initialize(twitchLogin, token.value.access_token);
		} catch (error) {
			console.log("FAILED !");
			errorIRC.value = true;
			loading.value = false;
			checkingToken.value = false;
			return;
		}
		// console.log("Connected to IRC !", res);
		loggedIn.value = true;
		loading.value = false;
		if (props.twitchOAToken) {
			//Test if spotify token is valid, this condition is true for
			//OBS route as it contains all the necessary tokens
			try {
				await SpotifyAPI.instance.call("v1/me", null, false);
			} catch (error) {
				spotifyExpired.value = true;
				needSpotifyAuth.value = true;
				return;
			}
			let route = {
				name: "twitch/obs/play"
			}
			router.push(route);
		} else if (!SpotifyAPI.instance.hasAccessToken) {
			spotifyExpired.value = false;
			needSpotifyAuth.value = true;
		} else {
			// let route = {name:'twitch/auth', params:{twitchOAToken:token.value, spotifyOAToken:storeMain.accessToken}};
			// urlOBS.value = document.location.origin+router.resolve(route).href;
			let route = { name: 'twitchobs/viewer', params: { twitchLogin: twitchLogin } };
			urlOBS.value = document.location.origin + router.resolve(route).href;
		}
		return true;
	}
	checkingToken.value = false;
	return false;
}

async function clickGenerate(): Promise<void> {
	authenticating.value = true;
	token.value = await TwitchUtils.requestDCF();
	submitToken();
	authenticating.value = false;
}

function selectText(e: Event): void {
	let div = <HTMLDivElement>e.target;
	var selection = window.getSelection();
	var range = document.createRange();
	range.selectNodeContents(div);
	selection.removeAllRanges();
	selection.addRange(range);

}

function copyURL(): void {
	Utils.copyToClipboard(urlOBS.value);
	gsap.set(url.value, { filter: "brightness(100%)" })
	gsap.from(url.value, { duration: .5, filter: "brightness(200%)" })
}

</script>

<style scoped lang="less">
.twitchauth {
	text-align: center;

	.loader {
		.center();
		position: absolute;
	}

	.step {
		margin-top: 20px;

		&:not(:first-of-type) {
			margin-top: 40px;
		}

		.head {
			font-size: 20px;
			margin-bottom: 10px;
		}

		form {
			width: 300px;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin: auto;

			input {
				width: 100%;
				text-align: center;
			}

			.submit {
				width: min-content;
				margin-top: 5px;
			}

			.error {
				color: #fff;
				display: inline-block;
				background-color: @mainColor_warn;
				padding: 5px 10px;
				width: ~"calc(100% - 30px)";
				box-sizing: border-box;
				border-bottom-left-radius: 10px;
				border-bottom-right-radius: 10px;
			}
		}

		.block {
			margin-bottom: 20px;

			.twitchExt {
				display: flex;
				flex-direction: column;
				align-items: center;

				&>*:not(:last-child) {
					margin-bottom: 5px;
				}

				.getAccess {
					font-size: 14px;
					font-style: italic;
					margin-top: -6px;
					margin-bottom: 10px;
					color: @mainColor_alert;
				}
			}

			.url {
				display: flex;
				flex-direction: row;
				justify-content: center;
				margin-top: 10px;
				margin-bottom: 10px;

				.text {
					color: #ffffff;
					padding: 5px 10px;
					display: inline-block;
					border-radius: 20px;
					background-color: @mainColor_normal;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					width: 300px;

					&:hover {
						word-wrap: break-word;
						overflow: visible;
						white-space: normal;
					}
				}

				.button {
					padding: 5px 10px 5px 5px;

					:deep(.icon) {
						margin-left: 0px;
						margin-right: 0px;
					}
				}
			}

			.dmca {

				div,
				.button {
					margin-bottom: 10px;
				}
			}
		}
	}

	.spotifyConnect {
		&>* {
			margin-bottom: 20px;
		}
	}

}
</style>