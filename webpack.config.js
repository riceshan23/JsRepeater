const path = require('path');
const { merge } = require('webpack-merge');

const commonConfig = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js-repeater.js',
    library: 'JsRepeater',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
};

const developmentConfig = {
  mode: 'development',
  devtool: 'source-map',
};

const productionConfig = {
  mode: 'production',
  optimization: {
    minimize: true,
  },
};

module.exports = (env, argv) => {
  return merge(commonConfig, argv.mode === 'production' ? productionConfig : developmentConfig);
};