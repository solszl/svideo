const webpack = require('webpack');
// 引入路径
const path = require('path');

const ver = require('../package.json').version;

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

const webpackConfig = {
  mode: process.env.NODE_ENV,
  devtool: process.env.NODE_ENV === 'production' ? '' : 'source-map',
  entry: {
    index: resolve('src/index.js')
  },
  output: {
    path: resolve('dist'),
    // filename: "[name].js",
    library: 'VHVideoModule',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{
      test: /\.js[x]?$/,
      loader: 'babel-loader',
      include: resolve('src'),
      exclude: '/node_modules'
    }, {
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        LOG_LEVEL: JSON.stringify(process.env.LOG_LEVEL),
        VERSION: JSON.stringify(ver),
        PF: JSON.stringify(process.env.PF)
      },
      __VERSION__: JSON.stringify(false),
      __USE_ALT_AUDIO__: JSON.stringify(false),
    })
  ]
};
module.exports = webpackConfig;