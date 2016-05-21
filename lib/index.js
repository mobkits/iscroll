var CustomEvent = require('custom-event');
var detect = require('prop-detect')
var Emitter = require('emitter')
var events = require('events')
var Tween = require('tween')
var raf = require('raf')
var throttle = require('throttleit')
var debounce = require('debounce')
var Handlebar = require('./handlebar')
var wheel = require('mouse-wheel')
var hasTouch = require('has-touch')
var computedStyle = require('computed-style')
var resizelistener = require('resizelistener')
var touchAction = detect.touchAction
var transform = detect.transform
var has3d = detect.has3d
var max = Math.max
var min = Math.min
var now = Date.now

var defineProperty = Object.defineProperty

/**
 * Create custom event
 *
 * @param {String} name
 * @return {Event}
 * @api private
 */
function customEvent(name) {
  var e
  try {
    e = new CustomEvent(name)
  } catch (error) {
    try {
      e = document.createEvent('CustomEvent')
      e.initCustomEvent(name, false, false, 0)
    } catch (err) {
      return
    }
  }
  return e
}

/**
 * Init iscroll with el and optional options
 * options.handlebar show handlebar if is true
 *
 * @param  {Element}  el
 * @param {Object} opts
 * @api public
 */
function Iscroll(el, opts) {
  if (!(this instanceof Iscroll)) return new Iscroll(el, opts)
  this.y = 0
  this.scrollable = el
  el.style.overflow = 'hidden'
  var children = [].slice.call(el.children)
  var nodes = children.filter(function (node) {
    var pos = computedStyle(node, 'position')
    return  pos == 'static' || pos == 'relative'
  })
  if (nodes.length !== 1) {
    throw new Error('iscroll need single position static/relative child of scrollable to work')
  }
  opts = opts || {}
  this.el = nodes[0]
  this.margin = parseInt(computedStyle(this.el, 'margin-bottom'), 10)
                + parseInt(computedStyle(this.el, 'margin-top'), 10)
  this.touchAction('none')
  this.refresh(true)
  this.bind()
  var self = this
  if (defineProperty) {
    defineProperty(this.scrollable, 'scrollTop', {
      set: function(v) {
        return self.scrollTo(-v, 400)
      },
      get: function() {
        return -self.y
      }
    })
  }
  this.on('scroll', function() {
    var e = customEvent('scroll')
    if (e) el.dispatchEvent(e)
  })
  this.max = opts.max || 80
  if (opts.handlebar !== false) {
    this.handlebar = new Handlebar(el, opts.barClass)
    if (!hasTouch) this.resizeHandlebar()
  }
  this._refresh = this.refresh.bind(this)
  this._unbindresize = resizelistener(this.el, this._refresh)
}

Emitter(Iscroll.prototype)

/**
 * Bind events
 *
 * @api private
 */
Iscroll.prototype.bind = function() {
  this.events = events(this.scrollable, this)
  this.docEvents = events(document, this)

  // W3C touch events
  this.events.bind('touchstart')
  this.events.bind('touchmove')
  this.events.bind('touchleave', 'ontouchend')
  this.docEvents.bind('touchend')
  this.docEvents.bind('touchcancel', 'ontouchend')

  if (!hasTouch) this._wheelHandler = wheel(this.scrollable, this.onwheel.bind(this), true)
}

/**
 * Recalculate the height
 *
 * @api public
 */
Iscroll.prototype.refresh = function(noscroll) {
  var sh = this.viewHeight = this.scrollable.getBoundingClientRect().height
  var ch = this.height = this.el.getBoundingClientRect().height + this.margin
  this.minY = min(0, sh - ch)
  if (noscroll === true) return
  if (this.y < this.minY) {
    this.scrollTo(this.minY, 300)
  } else if (this.y > 0) {
    this.scrollTo(0, 300)
  }
}

/**
 * Unbind all event listeners, and remove handlebar if necessary
 *
 * @api public
 */
Iscroll.prototype.unbind = function() {
  this._unbindresize()
  this.off()
  this.events.unbind()
  this.docEvents.unbind()
  if (this._wheelHandler) this.scrollable.removeEventListener('wheel', this._wheelHandler)
  if (this.handlebar) this.scrollable.removeChild(this.handlebar.el)
}

Iscroll.prototype.onwheel = function (dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return
  if (this.handlebar) this.resizeHandlebar()
  var y = this.y - dy
  if (y > 0) y = 0
  if (y < this.minY) y = this.minY
  if (y === this.y) return
  this.scrollTo(y, 20, 'linear')
}


/**
 * touchstart event handler
 *
 * @param  {Event}  e
 * @api private
 */
Iscroll.prototype.ontouchstart = function(e) {
  this.speed = null
  if (this.tween) this.tween.stop()
  this.refresh(true)
  var start = this.y
  if (e.target === this.scrollable) {
    start = min(start, 0)
    start = max(start, this.minY)
      // fix the invalid start position
    if (start !== this.y) return this.scrollTo(start, 200)
    return
  }

  var touch = this.getTouch(e)
  var sx = touch.clientX
  var sy = touch.clientY
  var at = now()


  this.onstart = function(x, y) {
    // no moved up and down, so don't know
    if (sy === y) return
    this.onstart = null
    var dx = Math.abs(x - sx)
    var dy = Math.abs(y - sy)
      // move left and right
    if (dx > dy) return
    this.clientY = touch.clientY
    this.dy = 0
    this.ts = now()
    this.down = {
      x: sx,
      y: sy,
      start: start,
      at: at
    }
    if (this.handlebar) this.resizeHandlebar()
    this.emit('start', this.y)
    return true
  }
}

/**
 * touchmove event handler
 *
 * @param  {Event}  e
 * @api private
 */
Iscroll.prototype.ontouchmove = function(e) {
  e.preventDefault()
  if (!this.down && !this.onstart) return
  var touch = this.getTouch(e)
  var x = touch.clientX
  var y = touch.clientY
  if (this.onstart) {
    var started = this.onstart(x, y)
    if (started !== true) return
  }
  var down = this.down
  var dy = this.dy = y - down.y

  //calculate speed every 100 milisecond
  this.calcuteSpeed(touch.clientY, down.at)
  var start = this.down.start
  var dest = start + dy
  dest = min(dest, this.max)
  dest = max(dest, this.minY - this.max)
  this.translate(dest)
}

/**
 * Calcute speed by clientY
 *
 * @param {Number} y
 * @api priavte
 */
Iscroll.prototype.calcuteSpeed = function(y, start) {
  var ts = now()
  var dt = ts - this.ts
  if (ts - start < 100) {
    this.distance = y - this.clientY
    this.speed = Math.abs(this.distance / dt)
  } else if (dt > 100) {
    this.distance = y - this.clientY
    this.speed = Math.abs(this.distance / dt)
    this.ts = ts
    this.clientY = y
  }
}

/**
 * Event handler for touchend
 *
 * @param  {Event}  e
 * @api private
 */
Iscroll.prototype.ontouchend = function(e) {
  if (!this.down) return
  var at = this.down.at
  this.down = null
  var touch = this.getTouch(e)
  this.calcuteSpeed(touch.clientY, at)
  var m = this.momentum()
  this.scrollTo(m.dest, m.duration, m.ease)
  this.emit('release', this.y)
}

/**
 * Calculate the animate props for moveon
 *
 * @return {Object}
 * @api private
 */
Iscroll.prototype.momentum = function() {
  var deceleration = 0.001
  var speed = this.speed
  speed = min(speed, 2)
  var y = this.y
  var rate = (4 - Math.PI)/2
  var destination = y + rate * (speed * speed) / (2 * deceleration) * (this.distance < 0 ? -1 : 1)
  var duration = speed / deceleration
  var ease
  var minY = this.minY
  if (y > 0 || y < minY) {
    duration = 500
    ease = 'out-circ'
    destination = y > 0 ? 0 : minY
  } else if (destination > 0) {
    destination = 0
    ease = 'out-back'
  } else if (destination < minY) {
    destination = minY
    ease = 'out-back'
  }
  return {
    dest: destination,
    duration: duration,
    ease: ease
  }
}


/**
 * Scroll to potions y with optional duration and ease function
 *
 * @param {Number} y
 * @param {Number} duration
 * @param {String} easing
 * @api public
 */
Iscroll.prototype.scrollTo = function(y, duration, easing) {
  if (this.tween) this.tween.stop()
  var transition = (duration > 0 && y !== this.y)
  if (!transition) {
    this.direction = 0
    this.translate(y)
    return this.onScrollEnd()
  }

  this.direction = y > this.y ? -1 : 1

  easing = easing || 'out-cube'
  var tween = this.tween = Tween({
      y: this.y
    })
    .ease(easing)
    .to({
      y: y
    })
    .duration(duration)

  var self = this
  tween.update(function(o) {
    self.translate(o.y)
  })
  var promise = new Promise(function(resolve) {
    tween.on('end', function() {
      resolve()
      self.animating = false
      animate = function() {} // eslint-disable-line
      if (!tween.stopped) { // no emit scrollend if tween stopped
        self.onScrollEnd()
      }
    })
  })

  function animate() {
    raf(animate)
    tween.update()
  }

  animate()
  this.animating = true
  return promise
}

/**
 * Scrollend
 *
 * @api private
 */
Iscroll.prototype.onScrollEnd = debounce(function() {
  if (this.animating) return
  if (hasTouch) this.hideHandlebar()
  var y = this.y
  this.emit('scrollend', {
    top: y >= 0,
    bottom: y <= this.minY
  })
}, 20)

/**
 * Gets the appropriate "touch" object for the `e` event. The event may be from
 * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
 *
 * @api private
 */

Iscroll.prototype.getTouch = function(e) {
  // "mouse" and "Pointer" events just use the event object itself
  var touch = e
  if (e.changedTouches && e.changedTouches.length > 0) {
    // W3C "touch" events use the `changedTouches` array
    touch = e.changedTouches[0]
  }
  return touch
}


/**
 * Translate to `x`.
 *
 *
 * @api private
 */

Iscroll.prototype.translate = function(y) {
  var s = this.el.style
  if (isNaN(y)) return
  y = Math.floor(y)
    //reach the end
  if (this.y !== y) {
    this.y = y
    this.emit('scroll', -y)
    if (this.handlebar) this.transformHandlebar()
  }
  if (has3d) {
    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)'
  } else {
    s[transform] = 'translateY(' + y + 'px)'
  }
}

/**
 * Sets the "touchAction" CSS style property to `value`.
 *
 * @api private
 */

Iscroll.prototype.touchAction = function(value) {
  var s = this.el.style
  if (touchAction) {
    s[touchAction] = value
  }
}

/**
 * Transform handlebar
 *
 * @api private
 */
Iscroll.prototype.transformHandlebar = throttle(function() {
  var vh = this.viewHeight
  var h = this.height
  var y = Math.round(-(vh - vh * vh / h) * this.y / (h - vh))
  this.handlebar.translateY(y)
}, 100)

/**
 * show the handlebar and size it
 * @api public
 */
Iscroll.prototype.resizeHandlebar = function() {
  var vh = this.viewHeight
  var h = vh * vh / this.height
  this.handlebar.resize(h)
}

/**
 * Hide handlebar
 *
 * @api private
 */
Iscroll.prototype.hideHandlebar = function() {
  if (this.handlebar) this.handlebar.hide()
}

module.exports = Iscroll
