var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var commonConfig = require('./webpack.common.js');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

module.exports = webpackMerge(commonConfig, {
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            ie8: false,
            compress: {
                warnings: false
            },
            output: {
                comments: false,
                beautify: false
            },
            sourceMap: false,
            parallel: true,
            ecma: 5
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'ENV': JSON.stringify(ENV),
                'NODE_ENV': '"production"'
            }
        })
    ]
});