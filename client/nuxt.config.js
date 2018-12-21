module.exports = {
	/*
	 ** Headers of the page
	 */
	head: {
		title: 'S4A Central',
		meta: [
			{charset: 'utf-8'},
			{name: 'viewport', content: 'width=device-width, initial-scale=1'},
			{hid: 'description', name: 'description', content: 'S4A Central'}
		],
		link: [
			{rel: 'icon', type: 'image/x-icon', href: '/favicon.png'},
			{rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'}
		]
	},
	/*
	 ** Customize the progress-bar color
	 */
    loading: {color: '#77b6ff', height: '5px'},
	/*
	 ** Build configuration
	 */
	plugins: ['~/plugins/vuetify.js', '~/plugins/moment.js', '~/plugins/axios.js', '~/plugins/i18n.js'],
	css: [
		{src: '~/assets/style/app.styl', lang: 'styl'}
	],
	modules: [
		'@nuxtjs/axios',
	],
	axios: {
		baseURL: process.env.API_URL || '____API_URL_ERROR____CHECK_ENV____'
	},
	env: {
		URL_GRAFANA: process.env.URL_GRAFANA || 'http://grafana/',
        API_URL: process.env.API_URL || '____API_URL_ERROR____CHECK_ENV____'
	},
	build: {
		extractCSS: true,
		extend(config, ctx) {
			// Run ESLint on save
			// if (ctx.isDev && ctx.isClient) {
			//     config.module.rules.push({
			//         enforce: 'pre',
			//         test: /\.(js|vue)$/,
			//         loader: 'eslint-loader',
			//         exclude: /(node_modules)/
			//     })
			// }
		}
	}
};
