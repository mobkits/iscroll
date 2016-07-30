import CustomEvent from 'custom-event'
import {touchAction, transform, has3d} from 'prop-detect'
import Emitter from 'emitter'
import events from 'events'
import Tween from 'tween'
import raf from 'raf'
import throttle from 'throttleit'
import debounce from 'debounce'
import Handlebar from './handlebar'
import wheel from 'mouse-wheel-event'
import hasTouch from 'has-touch'
import computedStyle from 'computed-style'
import resizelistener from 'resizelistener'

const max = Math.max
const min = Math.min
const now = Date.now || function () {
  return (new Date()).getTime()
}

const defineProperty = Object.defineProperty

/**
 * Init iscroll with el and optional options
 * options.handlebar show handlebar if is true
 *
 * @param  {Element}  el
 * @param {Object} opts
 * @api public
 */
class Iscroll {
  constructor(el, opts) {
    this.y = 0
    this.scrollable = el
    el.style.overflow = 'hidden'
    opts = opts || {}
    this.el = el.firstElementChild
    this.margin = parseInt(computedStyle(this.el, 'margin-bottom'), 10)
                  + parseInt(computedStyle(this.el, 'margin-top'), 10)
    this.margin = this.margin || 0
    this.touchAction('none')
    this.refresh(true)
    this.bind()
    const self = this
    if (defineProperty) {
      defineProperty(this.scrollable, 'scrollTop', {
        set(v) {
          return self.scrollTo(-v, 400)
        },
        get() {
          return -self.y
        }
      })
    }
    this.on('scroll', () => {
      const e = new CustomEvent('scroll')
      if (e) el.dispatchEvent(e)
    })
    this.max = opts.max || 80
    if (opts.handlebar !== false) {
      this.handlebar = new Handlebar(el, opts.barClass)
      if (!hasTouch) this.resizeHandlebar()
    }
    this._refresh = this.refresh.bind(this)
    this._unbindresize = resizelistener(this.el, this._refresh)
    this.onScrollEnd = debounce(this.onScrollEnd, 30)
    this.transformHandlebar = throttle(this.transformHandlebar, 100)
  }

  /**
   * Bind events
   *
   * @api private
   */
  bind() {
    this.events = events(this.scrollable, this)
    this.docEvents = events(document, this)

    // W3C touch events
    this.events.bind('touchstart')
    this.events.bind('touchmove')
    this.events.bind('touchleave', 'ontouchend')
    this.docEvents.bind('touchend')
    this.docEvents.bind('touchcancel', 'ontouchend')
    this._wheelUnbind = wheel(this.scrollable, this.onwheel.bind(this), true)
  }

  /**
   * Recalculate the height
   *
   * @api public
   */
  refresh(noscroll) {
    const sh = this.viewHeight = this.scrollable.getBoundingClientRect().height
    const ch = this.height = this.el.getBoundingClientRect().height + this.margin
    if (isNaN(sh) || isNaN(ch)) {
      this.minY = 0
    } else {
      this.minY = min(0, sh - ch)
    }
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
  unbind() {
    this._unbindresize()
    this.off()
    this.events.unbind()
    this.docEvents.unbind()
    this._wheelUnbind()
    if (this.handlebar) this.scrollable.removeChild(this.handlebar.el)
  }

  onwheel(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return
    if (this.handlebar) this.resizeHandlebar()
    let y = this.y - dy
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
  ontouchstart(e) {
    this.speed = null
    if (this.tween) this.tween.stop()
    this.refresh(true)
    let start = this.y
    if (e.target === this.scrollable) {
      start = min(start, 0)
      start = max(start, this.minY)
        // fix the invalid start position
      if (start !== this.y) return this.scrollTo(start, 200)
      return
    }

    const touch = this.getTouch(e)
    const sx = touch.clientX
    const sy = touch.clientY
    const at = now()


    this.onstart = function(x, y) {
      // no moved up and down, so don't know
      if (sy === y) return
      this.onstart = null
      const dx = Math.abs(x - sx)
      const dy = Math.abs(y - sy)
        // move left and right
      if (dx > dy) return
      this.clientY = touch.clientY
      this.dy = 0
      this.ts = now()
      this.down = {
        x: sx,
        y: sy,
        start,
        at
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
  ontouchmove(e) {
    e.preventDefault()
    if (!this.down && !this.onstart) return
    const touch = this.getTouch(e)
    const x = touch.clientX
    const y = touch.clientY
    if (this.onstart) {
      const started = this.onstart(x, y)
      if (started !== true) return
    }
    const down = this.down
    const dy = this.dy = y - down.y

    //calculate speed every 100 milisecond
    this.calcuteSpeed(touch.clientY, down.at)
    const start = this.down.start
    let dest = start + dy
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
  calcuteSpeed(y, start) {
    const ts = now()
    const dt = ts - this.ts
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
  ontouchend(e) {
    if (!this.down) return
    const at = this.down.at
    this.down = null
    const touch = this.getTouch(e)
    this.calcuteSpeed(touch.clientY, at)
    const m = this.momentum()
    this.scrollTo(m.dest, m.duration, m.ease)
    this.emit('release', this.y)
  }

  /**
   * Calculate the animate props for moveon
   *
   * @return {Object}
   * @api private
   */
  momentum() {
    const deceleration = 0.001
    let speed = this.speed
    speed = min(speed, 2)
    const y = this.y
    const rate = (4 - Math.PI)/2
    let destination = y + rate * (speed * speed) / (2 * deceleration) * (this.distance < 0 ? -1 : 1)
    let duration = speed / deceleration
    let ease
    const minY = this.minY
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
      duration,
      ease
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
  scrollTo(y, duration, easing) {
    if (this.tween) this.tween.stop()
    const transition = (duration > 0 && y !== this.y)
    if (!transition) {
      this.direction = 0
      this.translate(y)
      return this.onScrollEnd()
    }

    this.direction = y > this.y ? -1 : 1

    easing = easing || 'out-circ'
    const tween = this.tween = Tween({
        y: this.y
      })
      .ease(easing)
      .to({
        y
      })
      .duration(duration)

    const self = this
    tween.update(o => {
      self.translate(o.y)
    })
    const promise = new Promise(resolve => {
      tween.on('end', () => {
        resolve()
        self.animating = false
        animate = () => {} // eslint-disable-line
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
   * Gets the appropriate "touch" object for the `e` event. The event may be from
   * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
   *
   * @api private
   */

  getTouch(e) {
    // "mouse" and "Pointer" events just use the event object itself
    let touch = e
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

  translate(y) {
    const s = this.el.style
    if (isNaN(y)) return
    y = Math.floor(y)
      //reach the end
    if (this.y !== y) {
      this.y = y
      this.emit('scroll', -y)
      if (this.handlebar) this.transformHandlebar()
    }
    if (has3d) {
      s[transform] = `translate3d(0, ${y}px, 0)`
    } else {
      if (transform) {
        s[transform] = `translateY(${y}px)`
      } else {
        s.top = `${y}px`
      }
    }
  }

  /**
   * Sets the "touchAction" CSS style property to `value`.
   *
   * @api private
   */

  touchAction(value) {
    const s = this.el.style
    if (touchAction) {
      s[touchAction] = value
    }
  }

  /**
   * show the handlebar and size it
   * @api public
   */
  resizeHandlebar() {
    const vh = this.viewHeight
    const h = vh * vh / this.height
    this.handlebar.resize(h)
  }

  /**
   * Hide handlebar
   *
   * @api private
   */
  hideHandlebar() {
    if (this.handlebar) this.handlebar.hide()
  }

  /**
  * Scrollend
  *
  * @api private
  */
  onScrollEnd() {
    if (this.animating) return
    if (hasTouch) this.hideHandlebar()
    const y = this.y
    this.emit('scrollend', {
      top: y >= 0,
      bottom: y <= this.minY
    })
  }

  /**
  * Transform handlebar
  *
  * @api private
  */
  transformHandlebar() {
    const vh = this.viewHeight
    const h = this.height
    const y = Math.round(-(vh - vh * vh / h) * this.y / (h - vh))
    this.handlebar.translateY(y)
  }
}

Emitter(Iscroll.prototype)

export default Iscroll
