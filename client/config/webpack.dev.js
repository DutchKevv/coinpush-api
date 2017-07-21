const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ENV = process.env.ENV = process.env.NODE_ENV = 'development';
const WriteFilePlugin = require('write-file-webpack-plugin');

const constants = {
    host: 'localhost',
    port: 4200,
    backend_host: 'localhost',
    backend_port: '3000'
}

module.exports = webpackMerge(commonConfig, {
    performance: {
        hints: false
    },
    devtool: 'cheap-module-source-map',
    plugins: [
        new WriteFilePlugin(),
        // new DefinePlugin({
        //     'ENV': 'development',
        // })
    ],
    devServer: {
        contentBase: path.join(__dirname, '..', 'dist'),
        stats: { colors: true },
        port: constants.port,
        host: constants.host,
        historyApiFallback: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        },
    }
});