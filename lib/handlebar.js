var detect = require('prop-detect')
var has3d = detect.has3d
var transform = detect.transform

/**
 * Handlebar contructor
 *
 * @param {Element} scrollable
 * @contructor
 * @api public
 */
function handlebar(scrollable, className) {
  var el = this.el = document.createElement('div')
  el.className = className || 'iscroll-handlebar'
  scrollable.appendChild(el)
}

/**
 * Show the handlebar and resize it
 *
 * @param {Number} h
 * @api public
 */
handlebar.prototype.resize = function (h) {
  var s = this.el.style
  s.height = h + 'px'
  s.backgroundColor = 'rgba(0,0,0,0.4)'
}

/**
 * Hide this handlebar
 *
 * @api public
 */
handlebar.prototype.hide = function () {
  this.el.style.backgroundColor = 'transparent'
}

/**
 * Move handlebar by translateY
 *
 * @param {Number} y
 * @api public
 */
handlebar.prototype.translateY= function(y){
  var s = this.el.style
  if (has3d) {
    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)'
  } else {
    s[transform] = 'translateY(' + y + 'px)'
  }
}

module.exports = handlebar
