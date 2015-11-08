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
var now = Date.now || function () {
  return (new Date()).getTime()
}

var defineProperty = Object.defineProperty

function lastVisible(el) {
  var nodes = el.childNodes
  for(var i = nodes.length - 1; i >=0; i --) {
    var node = nodes[i]
    if (node.nodeType === 1 && computedStyle(node, 'display') !== 'none') {
      return node
    }
  }
}

/**
 * Create a wrapper inside scrollable element
 *
 * @param  {Element}  el
 * @return {undefined}
 * @api public
 */
function createWrapper(el) {
  var div = document.createElement('div')
  div.className = 'iscroll-wrapper'
  div.style.padding = '0px'
  div.style.margin = '0px'
  var fragment = document.createDocumentFragment()
  var children = el.children
  var l = children.length
  if (l !== 0) {
    for (var i = 0; i < l; i++) {
      fragment.appendChild(children[0])
    }
    div.appendChild(fragment)
  }
  el.appendChild(div)
  return div
}

function Iscroll(el, opts) {
  if (! (this instanceof Iscroll)) return new Iscroll(el, opts)
  this.y = 0
  this.scrollable = el
  el.style.overflow = 'hidden'
  this.el = createWrapper(el)
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
    var e = new CustomEvent('scroll')
    el.dispatchEvent(e)
  })
  opts = opts || {}
  if (opts.handlebar) {
    this.handlebar = new Handlebar(el)
  }
  this._refresh = this.refresh.bind(this)
  window.addEventListener("orientationchange", this._refresh, false)
  window.addEventListener("resize", this._refresh, false)
}

Emitter(Iscroll.prototype)

Iscroll.prototype.bind = function () {
  this.events = events(this.el, this)
  this.docEvents = events(document, this)

   // W3C touch events
  this.events.bind('touchstart')
  this.events.bind('touchmove')
  this.docEvents.bind('touchend')
}

/**
 * recalculate height
 *
 * @api public
 */
Iscroll.prototype.refresh = function () {
  var child = lastVisible(this.el)
  this.viewHeight = parseInt(computedStyle(this.scrollable, 'height'), 10)
  var cb = child.getBoundingClientRect().bottom
  var b = this.el.getBoundingClientRect().bottom
  var h = parseInt(computedStyle(this.el, 'height'), 10)
  this.height = h + (cb - b)
  this.el.style.height = this.height + 'px'
}

Iscroll.prototype.unbind = function () {
  this.off()
  this.events.unbind()
  this.docEvents.unbind()
  window.removeEventListener('orientationchange', this._refresh, false)
  window.removeEventListener('resize', this._refresh, false)
  if (this.handlebar) this.scrollable.removeChild(this.handlebar)
}

Iscroll.prototype.restrict = function (y) {
  y = min(y , 80)
  y = max(y , this.viewHeight - this.height - 80)
  return y
}

Iscroll.prototype.ontouchstart = function (e) {
  this.speed = null
  this.leftright = null
  if (this.tween) this.tween.stop()
  this.dy = 0
  this.ts = now()
  if (this.handlebar) this.resizeHandlebar()

  var touch = this.getTouch(e)
  this.pageY = touch.pageY
  this.down = {
    x: touch.pageX,
    y: touch.pageY,
    start: this.y,
    at: now()
  }
}

Iscroll.prototype.ontouchmove = function (e) {
  e.preventDefault()
  // do nothing if left right move
  if (e.touches.length > 1 || !this.down || this.leftright) return
  var touch = this.getTouch(e)

  var down = this.down
  var y = touch.pageY
  this.dy = y - down.y

  // determine dy and the slope
  if (null == this.leftright) {
    var x = touch.pageX
    var dx = x - down.x
    var slope = dx / this.dy

    // if is greater than 1 or -1, we're swiping up/down
    if (slope > 1 || slope < -1) {
      this.leftright = true
      if (this.handlebar) this.hideHandlebar()
      return
    } else {
      this.leftright = false
    }
  }

  //calculate speed every 100 milisecond
  this.calcuteSpeed(y)
  var start = this.down.start
  var dest = this.restrict(start + this.dy)
  this.translate(dest)
}

Iscroll.prototype.calcuteSpeed = function (y) {
  var ts = now()
  this.ts = this.ts || this.down.at
  this.pageY = (this.pageY == null) ? this.down.y : this.pageY
  var dt = ts - this.ts
  if (ts - this.down.at < 100) {
    this.distance = y - this.pageY
    this.speed = Math.abs(this.distance/dt)
  } else if(dt > 100){
    this.distance = y - this.pageY
    this.speed = Math.abs(this.distance/dt)
    this.ts = ts
    this.pageY = y
  }
}

Iscroll.prototype.ontouchend = function (e) {
  if (!this.down || this.leftright) return
  var touch = this.getTouch(e)
  this.calcuteSpeed(touch.pageY)
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

Iscroll.prototype.hideHandlebar = function () {
  if (this.handlebar) this.handlebar.hide()
}

module.exports = Iscroll
