const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/GPGPU.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.join(__dirname, './lib'),
    filename: 'gpgpu.js',
  },
}
