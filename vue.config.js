module.exports = {

	chainWebpack: (config) => {
		config.plugin('html')
		.tap(args => {
			args[0].minify = false
			return args
		})
	},

    configureWebpack: {
		resolve: {
			alias: {
				'@': __dirname + '/front_src'
			}
		},
		entry: {
			app: './front_src/main.ts'
		},
	},
	css: {
		loaderOptions: {
			less: {
				additionalData: `@import (reference) "@/less/index.less";@import (reference) "@/less/_includes.less";`
			}
		}
	}
}