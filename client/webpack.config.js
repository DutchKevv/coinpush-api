const
	path = require('path'),
	webpack = require("webpack");

module.exports = {
	entry: {
		"vendor": "./vendor",
		"app": "./main"
	},
	output: {
		path: __dirname,
		filename: "./dist/[name].bundle.js"
	},
	resolve: {
		extensions: ['.js', '.ts', '.css', '.scss', '.html']
	},
	devtool: 'source-map',
	// devServer: {
	// 	stats: {
	// 		colors: true,
	// 		hash: true,
	// 		version: false,
	// 		timings: false,
	// 		assets: false,
	// 		chunks: false,
	// 		modules: true,
	// 		reasons: false,
	// 		children: false,
	// 		source: false,
	// 		errors: true,
	// 		errorDetails: true,
	// 		warnings: true,
	// 		publicPath: false
	// 	}
	// },
	module: {
		noParse: [
			path.join(__dirname, 'assets', 'vendor')
		],
		loaders: [
			{ //this rule will only be used for any vendors
				test: /\.css$/,
				loaders: ['to-string-loader', 'css-loader']
				// include: [/node_modules/]
			},
			{
				test: /\.scss$/,
				// exclude: /node_modules/,
				loader: 'raw-loader!sass-loader'
			},
			// { test: /\.ts$/, loader: '@ngtools/webpack' },
			{
				test: /\.ts/,
				loaders: ['awesome-typescript-loader', 'angular2-template-loader'],
				exclude: [/node_modules/, /server/]
			},
			{
				test: /\.html$/,
				loader: 'raw-loader'
			},
			{
				test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
				loader: "url-loader?limit=10000&mimetype=application/font-woff"
			}, {
				test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
				loader: "url-loader?limit=10000&mimetype=application/font-woff"
			}, {
				test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
				loader: "url-loader?limit=10000&mimetype=application/octet-stream"
			}, {
				test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
				loader: "file-loader"
			}, {
				test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
				loader: "url-loader?limit=10000&mimetype=image/svg+xml"
			},
			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				loaders: ['file-loader?context=src/images&name=images/[path][name].[ext]', {
					loader: 'image-webpack-loader',
					query: {
						mozjpeg: {
							progressive: true,
						},
						gifsicle: {
							interlaced: false,
						},
						optipng: {
							optimizationLevel: 4,
						},
						pngquant: {
							quality: '75-90',
							speed: 3,
						},
					},
				}]
			}
		]
	},
	plugins: [
		// new ngToolsWebpack.AotPlugin({
		// 	tsConfigPath: './tsconfig.json'
		// }),
		new webpack.ProvidePlugin({
			jQuery: 'jquery',
			$: 'jquery',
			jquery: 'jquery',
			Tether: 'tether',
			CanvasJS: 'CanvasJS/dist/canvasjs.min',

		}),
		new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: './dist/vendor.bundle.js'}),
		// new webpack.ContextReplacementPlugin(/ace/, /^$/)
	],
	externals: {
		fs: '""',
		path: '""',
		electron: '""',
		stream: '""'
	}
};