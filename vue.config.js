const htmlwp = require('html-webpack-plugin');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
module.exports = {
	//Uncomment this line before compiling twitch extension
	// publicPath: './',

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
        plugins: [
            new NodePolyfillPlugin(),
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer']
            }),
        ],
		resolve: {
			alias: {
				'@': __dirname + '/front_src'
			},
            fallback: {
                "assert": require.resolve("assert/"),
                "util": require.resolve("util/"),
                "url": require.resolve("url/"),
                "crypto": require.resolve("crypto-browserify"),
                "querystring": require.resolve("querystring-es3"),
                "stream": require.resolve("stream-browserify"),
                "http": require.resolve("stream-http"),
                "https": require.resolve("https-browserify"),
                "os": require.resolve("os-browserify/browser"),
                "path": require.resolve("path-browserify"),
                "zlib": require.resolve("browserify-zlib"),
                "net": false,
                "tls": false,
                "fs": false,
                "buffer": require.resolve("buffer/"),
                "process": require.resolve("process/browser"),
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