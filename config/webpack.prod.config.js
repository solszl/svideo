const path = require('path')
const chalk = require('chalk')
const baseConfig = require('./webpack.base.config')
const merge = require('webpack-merge')
// const CleanWebpackPlugin = require('clean-webpack-plugin');
const ProgressBarWebpackPlugin = require('progress-bar-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
// const TerserPlugin = require('terser-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}
const plugins = [
  // new CleanWebpackPlugin(['dist'], {
  //   root: resolve('/'),
  //   verbose: true,
  //   exclude: ['index.html', 'mobile.html']
  // }),
  new ProgressBarWebpackPlugin({
    format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)'
  })
]
const webpackConfig = merge(baseConfig, {
  optimization: {
    minimize: true,
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
      })
    ]
  },
  performance: {
    hints: false
  },
  plugins: plugins
})

module.exports = webpackConfig
