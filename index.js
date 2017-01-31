/**
 * Sails.js hook that provides Vue.js frontend via Webpack.
 */

var path = require('path');
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (sails) {

    return {

        defaults: {
            __configKey__: {
                config: {
                    entry: {
                        app: [path.resolve(__dirname, '../../assets/src/main.js')]
                    },
                    output: {
                        path: path.resolve(__dirname, '../../.tmp/public/'),
                        publicPath: '/',
                        filename: 'js/bundle.js'
                    },
                    plugins: [
                        new webpack.optimize.OccurrenceOrderPlugin(),
                        new webpack.NoErrorsPlugin(),
                        new CleanWebpackPlugin(['public'], {
                            root: path.join(__dirname, '../../.tmp'),
                            verbose: process.env.NODE_ENV === 'development'
                        }),
                        new CopyWebpackPlugin(
                            [
                                { from: 'assets/favicon.ico'},
                                { from: 'assets/robots.txt'},
                                { from: 'assets/images', to: 'images'},
                                { from: 'assets/js', to: 'js'},
                                { from: 'assets/styles', to: 'styles'}
                            ]
                        )
                    ],
                    module: {
                        rules: [
                            {
                                test: /\.vue$/,
                                loader: 'vue'
                            },
                            {
                                test: /\.js$/,
                                loader: 'babel-loader',
                                exclude: /node_modules/
                            },
                            {
                                test: /\.(png|jpg|gif|svg)$/,
                                loader: 'file',
                                query: {
                                    name: '[name].[ext]?[hash]'
                                }
                            }
                        ]
                    },
                    devServer: {
                        historyApiFallback: true,
                        noInfo: true
                    },
                    devtool: '#eval-source-map'
                },
                devServerConfig: {
                    filename: "js/bundle.js",
                    proxy: {
                        "*": "http://localhost:1337"
                    },
                    watchOptions: {
                        hot: true,
                        inline: true,
                        port: 3000
                    },
                    quiet: true
                }
            }
        },

        initialize: function (cb) {
            var config = this.defaults.vuewebpack.config;
            var devServerConfig = this.defaults.vuewebpack.devServerConfig;

            // Configure webpack dev server
            if (process.env.NODE_ENV === 'development') {
                config.output.publicPath = 'http://localhost:3000/';
                config.entry.app.unshift("webpack-dev-server/client?http://0.0.0.0:3000/", "webpack/hot/only-dev-server");
                config.plugins.unshift(new webpack.HotModuleReplacementPlugin());
            }
            else {
                config.plugins.unshift(new webpack.optimize.UglifyJsPlugin({ sourcemap: true, compress: { warnings: false }}));
            }

            // Create Webpack compiler
            var compiler = webpack(config, function(err, stats) {
                if (err) throw err;
                if (process.env.NODE_ENV === 'development') {
                    // Watch for changes
                    compiler.watch({ aggregateTimeout: 300 }, function(err, stats) {
                        if (err) throw err;
                        // Create Webpack dev server
                        devServer = new webpackDevServer(compiler, devServerConfig);
                        devServer.listen(3000);
                        return cb();
                    });
                }
                else {
                    // Run production build
                    compiler.run(function (err, stats) {
                        if (err) throw err;
                        return cb();
                    });
                }
            });
        }
    }
};
