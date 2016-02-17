var log = document.getElementById('log')
document.getElementById('add').addEventListener('click', function(e) {
  var c = el.querySelector('.content')
  for (var i = 1; i < 5; i++) {
    var node = document.createElement('li')
    node.textContent = i
    c.appendChild(node)
    if (is) is.refresh()
  }
}, false)

document.getElementById('top').addEventListener('click', function(e) {
  el.scrollTop = 0
}, false)

var el = document.querySelector('.scrollable')
el.addEventListener('scroll', function () {
  log.textContent = el.scrollTop
})

if ('ontouchstart' in window) {
  document.getElementById('mobile').style.display = 'none'
  var iscroll = require('..')

  var is = iscroll(el, {
    handlebar: true,
    autorefresh: false
  })

  is.on('scrollend', function(e) {
    console.log(e)
  })

}

