var detect = require('prop-detect')
var touchAction = detect.touchAction
var transform = detect.transform
var has3d = detect.has3d
var computedStyle = require('computed-style')
var Emitter = require('emitter')
var events = require('events')
var Tween = require('tween')
var raf = require('raf')
var throttle = require('throttleit')
var Handlebar = require('./handlebar')
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
  } catch(error) {
    try {
      e = document.createEvent('CustomEvent')
      e.initCustomEvent(name, false, false, 0)
    } catch(err) {
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
  if (! (this instanceof Iscroll)) return new Iscroll(el, opts)
  this.y = 0
  this.scrollable = el
  el.style.overflow = 'hidden'
  var children = el.children
  if (children.length !== 1) {
    throw new Error('iscroll need single element child of scrollable to work')
  }
  this.el = children[0]
  this.touchAction('none')
  this.refresh()
  this.bind()
  var self = this
  if (defineProperty) {
    defineProperty(this.scrollable, 'scrollTop', {
      set: function (v) {
        return self.scrollTo(-v, 200)
      },
      get: function () {
        return - self.y
      }
    })
  }
  this.on('scroll', function () {
    var e = customEvent('scroll')
    if (e) el.dispatchEvent(e)
  })
  opts = opts || {}
  this.max = opts.max || 80
  if (opts.handlebar) {
    this.handlebar = new Handlebar(el)
  }
  this._refresh = this.refresh.bind(this)
  window.addEventListener('orientationchange', this._refresh, false)
  window.addEventListener('resize', this._refresh, false)
}

Emitter(Iscroll.prototype)

/**
 * Bind events
 *
 * @api private
 */
Iscroll.prototype.bind = function () {
  this.events = events(this.scrollable, this)
  this.docEvents = events(document, this)

   // W3C touch events
  this.events.bind('touchstart')
  this.events.bind('touchmove')
  this.docEvents.bind('touchend')
  this.docEvents.bind('touchcancel', 'ontouchend')
}

/**
 * Recalculate the height
 *
 * @api public
 */
Iscroll.prototype.refresh = function () {
  this.viewHeight = this.scrollable.getBoundingClientRect().height
  this.height = this.el.getBoundingClientRect().height
}

/**
 * Unbind all event listeners, and remove handlebar if necessary
 *
 * @api public
 */
Iscroll.prototype.unbind = function () {
  this.off()
  this.events.unbind()
  this.docEvents.unbind()
  window.removeEventListener('orientationchange', this._refresh, false)
  window.removeEventListener('resize', this._refresh, false)
  if (this.handlebar) this.scrollable.removeChild(this.handlebar.el)
}

Iscroll.prototype.restrict = function (y) {
  y = min(y , this.max)
  var h = Math.max(this.height, this.viewHeight)
  y = max(y , this.viewHeight - h - this.max)
  return y
}

/**
 * touchstart event handler
 *
 * @param  {Event}  e
 * @api private
 */
Iscroll.prototype.ontouchstart = function (e) {
  this.speed = null
  if (this.tween) this.tween.stop()
  this.refresh()

  var touch = this.getTouch(e)
  var sx = touch.clientX
  var sy = touch.clientY
  var start = this.y
  this.onstart = function (x, y) {
    // no moved up and down, so don't know
    if (sy === y) return
    this.onstart = null
    var dx = Math.abs(x - sx)
    var dy = Math.abs(y - sy)
    // move left and right
    if (dx !== 0 && dx > dy) return
    this.clientY = touch.clientY
    this.dy = 0
    this.ts = now()
    this.down = {
      x: sx,
      y: sy,
      start: start,
      at: now()
    }
    if (this.handlebar) this.resizeHandlebar()
    return true
  }
}

/**
 * touchmove event handler
 *
 * @param  {Event}  e
 * @api private
 */
Iscroll.prototype.ontouchmove = function (e) {
  if (!this.down && !this.onstart) return
  e.preventDefault()
  var touch = this.getTouch(e)
  var x = touch.clientX
  var y = touch.clientY
  if (this.onstart) {
    var started = this.onstart(x, y)
    if (started !== true) return
  }
  var down = this.down
  var dy = this.dy = y - down.y

  // no move if contentHeight < viewHeight and move up
  if (this.height <= this.viewHeight && dy < 0) return

  //calculate speed every 100 milisecond
  this.calcuteSpeed(touch.clientY)
  var start = this.down.start
  var dest = this.restrict(start + dy)
  this.translate(dest)
}

/**
 * Calcute speed by clientY
 *
 * @param {Number} y
 * @api priavte
 */
Iscroll.prototype.calcuteSpeed = function (y) {
  var ts = now()
  var dt = ts - this.ts
  if (ts - this.down.at < 100) {
    this.distance = y - this.clientY
    this.speed = Math.abs(this.distance/dt)
  } else if(dt > 100){
    this.distance = y - this.clientY
    this.speed = Math.abs(this.distance/dt)
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
Iscroll.prototype.ontouchend = function (e) {
  if (!this.down) return
  if (this.height <= this.viewHeight && this.dy <= 0) {
    if(this.handlebar) this.handlebar.hide()
    return
  }
  var touch = this.getTouch(e)
  this.calcuteSpeed(touch.clientY)
  var m = this.momentum()
  this.scrollTo(m.dest, m.duration, m.ease)
  this.emit('release', this.y)
  this.down = null
}

/**
 * Calculate the animate props for moveon
 *
 * @return {Object}
 * @api private
 */
Iscroll.prototype.momentum = function () {
  var deceleration = 0.0004
  var speed = this.speed
  speed = min(speed, 0.8)
  var destination = this.y + ( speed * speed ) / ( 2 * deceleration ) * ( this.distance < 0 ? -1 : 1 )
  var duration = speed / deceleration
  var newY, ease
  if (destination > 0) {
    newY = 0
    ease = 'out-back'
  } else if (destination < this.viewHeight - this.height) {
    newY = this.viewHeight - this.height
    ease = 'out-back'
  }
  if (typeof newY === 'number') {
    duration = duration*(newY - this.y + 160)/(destination - this.y)
    destination = newY
  }
  if (this.y > 0 || this.y < this.viewHeight - this.height) {
    duration = 500
    ease = 'out-circ'
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
Iscroll.prototype.scrollTo = function (y, duration, easing) {
  if (this.tween) this.tween.stop()
  var intransition = (duration > 0 && y !== this.y)
  if (!intransition) {
    this.onScrollEnd()
    return this.translate(y)
  }

  easing = easing || 'out-cube'
  var tween = this.tween = Tween({y : this.y})
      .ease(easing)
      .to({y: y})
      .duration(duration)

  var self = this
  tween.update(function(o) {
    self.translate(o.y)
  })

  tween.on('end', function () {
    animate = function(){} // eslint-disable-line
    if (!tween.stopped) {
      self.onScrollEnd()
    }
  })

  function animate() {
    raf(animate)
    tween.update()
  }

  animate()
}

/**
 * Scrollend
 *
 * @api private
 */
Iscroll.prototype.onScrollEnd = function () {
  this.hideHandlebar()
  var top = this.y === 0
  var bottom = this.y === (this.viewHeight - this.height)
  this.emit('scrollend', {
    top: top,
    bottom: bottom
  })
}

/**
 * Gets the appropriate "touch" object for the `e` event. The event may be from
 * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
 *
 * @api private
 */

Iscroll.prototype.getTouch = function(e){
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
    this.emit('scroll', - y)
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

Iscroll.prototype.touchAction = function(value){
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
Iscroll.prototype.transformHandlebar = throttle(function(){
  var vh = this.viewHeight
  var h = this.height
  var bh = vh - vh * vh/h
  var ih = h - vh
  var y = parseInt(- bh * this.y/ih)
  this.handlebar.translateY(y)
}, 100)

/**
 * show the handlebar and size it
 * @api public
 */
Iscroll.prototype.resizeHandlebar = function(){
  var h = this.viewHeight * this.viewHeight/this.height
  this.handlebar.resize(h)
}

/**
 * Hide handlebar
 *
 * @api private
 */
Iscroll.prototype.hideHandlebar = function () {
  if (this.handlebar) this.handlebar.hide()
}

module.exports = Iscroll
