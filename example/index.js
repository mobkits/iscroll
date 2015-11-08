require('../iscroll.css')
if ('ontouchstart' in window) {
  document.getElementById('mobile').style.display = 'none'
}
var iscroll = require('..')
var el = document.querySelector('.scrollable')

var is = iscroll(el, {
  handlebar: true,
  autorefresh: false
})
var log = document.getElementById('log')

//is.on('scroll', function(y) {
//  log.textContent = y
//}, false)

el.addEventListener('scroll', function () {
  log.textContent = el.scrollTop
})

is.on('scrollend', function(e) {
  console.log(e)
})

document.getElementById('add').addEventListener('click', function(e) {
  var c = el.querySelector('.content')
  for (var i = 1; i < 5; i++) {
    var node = document.createElement('li')
    node.textContent = i
    c.appendChild(node)
    is.refresh()
  }
}, false)

document.getElementById('top').addEventListener('click', function(e) {
  is.scrollTo(0, 200)
}, false)
