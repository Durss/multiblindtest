module.exports = {

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