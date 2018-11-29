const chalk = require('chalk');
const baseConfig = require('./webpack.base.config');
const merge = require('webpack-merge');
const ProgressBarWebpackPlugin = require('progress-bar-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const plugins = [
  new BundleAnalyzerPlugin(),
  new ProgressBarWebpackPlugin({
    format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)'
  })
];

const webpackConfig = merge(baseConfig, {
  optimization: {
    minimize: false,
    minimizer: [
      new UglifyJSPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
        uglifyOptions: {
          ie8: false,
          ecma: 6,
          compress: true,
          mangle: true,
          warnings: false,
          drop_debugger: true,
          drop_console: false,
          output: {
            comments: false,
            beautify: false
          }
        }
      }),
    ]
  },
  performance: {
    hints: false
  },
  plugins: plugins
});

module.exports = webpackConfig;