module.exports = {
  entry: './example/index.js',
  output: {
    filename: 'bundle.js',
    path: 'example'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /(node_modules|dest)/, loader: 'babel-loader' },
      { test: /\.html$/, loader: 'html' },
      { test: /\.css$/, loader: 'style?!css?sourceMap' },
      { test: /\.json$/, loader: 'json' }
    ]
  }
}
