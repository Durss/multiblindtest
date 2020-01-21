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
				data: `@import "@/less/index.less";`
			}
		}
	}
}