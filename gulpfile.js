// npm i gulp-serve gulp-livereload webpack gulp-util gulp connect-livereload -D
var serve = require('gulp-serve')
var livereload = require('gulp-livereload')
var webpack = require('webpack')
var gutil = require('gulp-util')
var gulp = require('gulp')
var inject = require('connect-livereload')()
var path = require('path')
var WebpackDevServer = require('webpack-dev-server')
// test entry file
var testIndex = './test/test.js'
// webpack-dev-sserve port
var port = 8080

var webpackConfig = require('./webpack.config')
var myConfig = Object.create(webpackConfig)
// for debugging
myConfig.devtool = 'cheap-mobule-eval-sourcemap'
myConfig.debug = true

var paths = {
  scripts: ['lib/*.js', 'example/index.js'],
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

gulp.task('webpack:test', function (callback) {
  var entry = [
    'stack-source-map/register.js',
    'webpack-dev-server/client?http://localhost:' + port,
    'webpack/hot/dev-server',
    'mocha-notify!' + testIndex
  ]

  var config = Object.create(myConfig)
  config.entry = entry
  config.plugins = config.plugins || []
  // webpack need this to send request to webpack-dev-server
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
  // Get line of error in mocha
  config.devtool = 'cheap-module-eval-source-map'
  // must have
  config.output.path = __dirname
  var compiler = webpack(config)
  config.module = myConfig.module
  var server = new WebpackDevServer(compiler, {
    publicPath: '/',
    inline: true,
    historyApiFallback: false,
    stats: { colors: true }
  })
  server.listen(port, 'localhost', callback)
})
