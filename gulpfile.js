// npm i gulp-serve gulp-livereload webpack gulp-util gulp connect-livereload -D
var serve = require('gulp-serve')
var livereload = require('gulp-livereload')
var webpack = require('webpack')
var gutil = require('gulp-util')
var gulp = require('gulp')
var inject = require('connect-livereload')()
var path = require('path')
var webpackConfig = {
  entry: './example/index.js',
  output: {
    filename: 'bundle.js',
    path: 'example'
  },
  module: {
    loaders: [
      { test: /\.html$/, loader: 'html' },
      { test: /\.css$/, loader: 'style?!css?sourceMap' },
      { test: /\.json$/, loader: 'json' }
    ]
  }
}
var myConfig = Object.create(webpackConfig)
// for debugging
myConfig.devtool = 'sourcemap'
myConfig.debug = true

var paths = {
  scripts: ['index.js', 'example/index.js'],
  asserts: ['*.css', 'example/*.html']
}

gulp.task('default', ['build-dev'])

gulp.task('build-dev', ['webpack:build-dev', 'serve'], function () {
  livereload.listen({
    start: true
  })
  gulp.watch(paths.scripts, ['webpack:build-dev'])
  var watcher = gulp.watch(paths.asserts)
  watcher.on('change', function (e) {
    livereload.changed(e.path)
  })
})

// static server
gulp.task('serve', serve({
  root: [__dirname],
  // inject livereload script ot html
  middleware: inject
}))

var devCompiler = webpack(myConfig)
var outputFile = path.resolve(myConfig.output.path, myConfig.output.filename)

gulp.task('webpack:build-dev', function (callback) {
  devCompiler.run(function (err, stats) {
    if (err) throw new gutil.pluginError('webpack:build-dev', err) //eslint-disable-line
    gutil.log('[webpack:build-dev]', stats.toString({
      colors: true
    }))
    livereload.changed(outputFile)
    callback()
  })
})
