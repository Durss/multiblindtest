const htmlwp = require('html-webpack-plugin');
module.exports = {

	//MPA definitions
	// pages: {
	// 	game: {
	// 		entry:'./front_src/main.ts',
	// 		template:'./public/index.html',
	// 		filename:'game.html',
	// 	},
	// 	twitchExtension: {
	// 		entry:'./front_src/main_twitch.ts',
	// 		template:'./public/index_twitch.html',
	// 		filename:'index_twitch.html',
	// 	}
	// },

	// chainWebpack: (config) => {
		// config.plugin('html')
		// // .use(htmlwp)//Enable this to make MPA compiling properly
		// .tap(args => {
		// 	if(args && args.length > 0) {
		// 		args[0].minify = false
		// 	}
		// 	return args
		// })
	// },

    configureWebpack: {
		resolve: {
			alias: {
				'@': __dirname + '/front_src'
			}
		},
		entry: {
			app: './front_src/main.ts'
		},
		optimization: {
			minimize: false,//Avoids minifying the index which would break share meta for whatsapp
		}
	},
	css: {
		loaderOptions: {
			less: {
				additionalData: `@import (reference) "@/less/index.less";@import (reference) "@/less/_includes.less";`
			}
		}
	}
}