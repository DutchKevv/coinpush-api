const webpack = require("webpack"),
	path = require('path');

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
		extensions: ['.js', '.ts', '.css', '.scss']
	},
	devtool: 'source-map',
	module: {
		noParse: [
			path.join(__dirname, 'assets', 'vendor')
		],
		loaders: [
			{ //this rule will only be used for any vendors
				test: /\.css$/,
				loaders: ['style-loader', 'css-loader']
				// include: [/node_modules/]
			},
			{
				test: /\.scss$/,
				// exclude: /node_modules/,
				loader: 'raw-loader!sass-loader'
			},
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
		new webpack.ProvidePlugin({
			jQuery: 'jquery',
			$: 'jquery',
			jquery: 'jquery'
		}),
		new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: './dist/vendor.bundle.js'}),
		// new webpack.ContextReplacementPlugin(/ace/, /^$/)
	],
	externals: {
		'fs': '""',
		'path': '""',
		'electron': '""'
	}
};