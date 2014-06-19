var has3d = require('has-translate3d');
var touchAction = require('touchaction-property');
var events = require('events');
var styles = require('computed-style');
var transform = require('transform-property');
var frame = require('per-frame');
var throttle = require('throttle');
var Emitter = require('emitter');
var raf = require('raf');
var Tween = require('tween');
var max = Math.max;
var min = Math.min;
var now = Date.now || function () {
  return (new Date()).getTime();
}


function Iscroll(el) {
  if (! (this instanceof Iscroll)) return new Iscroll(el);
  this.el = el;
  this.touchAction('none');
  this.refresh();
  this.bind();
  this.viewHeight = parseInt(styles(this.el.parentNode).height, 10);
}

Emitter(Iscroll.prototype);

Iscroll.prototype.bind = function () {
  this.events = events(this.el, this);
  this.docEvents = events(document, this);

   // W3C touch events
  this.events.bind('touchstart');
  this.events.bind('touchmove');
  this.docEvents.bind('touchend');

}

Iscroll.prototype.refresh = function () {
  var sh = this.el.scrollHeight;
  var h = parseInt(styles(this.el).height, 10);
  if (sh !== h) {
    this.el.style.height = sh + 'px';
  }
  this.height = sh;
}

Iscroll.prototype.unbind = function () {
  this.events.unbind();
  this.docEvents.unbind();
}

Iscroll.prototype.restrict = function (y) {
  y = min(y , 80);
  y = max(y , this.viewHeight - this.height - 80);
  return y;
}

Iscroll.prototype.ontouchstart = function (e) {
  this.speed = null;
  if (this.tween) this.tween.stop();
  this.refresh();
  this.transitionDuration(0);
  this.dy = 0;
  this.ts = now();
  this.leftright = null;

  var touch = this.getTouch(e);
  this.pageY = touch.pageY;
  this.down = {
    x: touch.pageX,
    y: touch.pageY,
    start: (this.y || 0),
    at: now()
  };
}

Iscroll.prototype.ontouchmove = frame(function (e) {
  if (!this.down || this.leftright) return;
  var touch = this.getTouch(e);
  // TODO: ignore more than one finger
  if (!touch) {
    return;
  }
  e.preventDefault();

  var down = this.down;
  var y = touch.pageY;
  this.dy = y - down.y;

  // determine dy and the slope
  if (null == this.updown) {
    var x = touch.pageX;
    var dx = x - down.x;
    var slope = dx / this.dy;

    // if is greater than 1 or -1, we're swiping up/down
    if (slope > 1 || slope < -1) {
      this.leftright = true;
      return;
    } else {
      this.leftright = false;
    }
  }

  //calculate speed every 100 milisecond
  this.calcuteSpeed(y);
  var start = this.down.start;
  var dest = this.restrict(start + this.dy);
  this.translate(dest);
})

Iscroll.prototype.calcuteSpeed = function (y) {
  var ts = now();
  this.ts = this.ts || this.down.at;
  this.pageY = (this.pageY == null) ? this.down.y : this.pageY;
  var dt = ts - this.ts;
  if (ts - this.down.at < 100) {
    this.distance = y - this.pageY;
    this.speed = Math.abs(this.distance/dt);
  } else if(dt > 50){
    this.distance = y - this.pageY;
    this.speed = Math.abs(this.distance/dt);
    this.ts = ts;
    this.pageY = y;
  }
}

Iscroll.prototype.ontouchend = function (e) {
  e.stopPropagation();
  if (!this.down) return;
  var touch = this.getTouch(e);
  this.emit('release', this.y);
  this.calcuteSpeed(touch.pageY);
  var m = this.momentum();
  this.scrollTo(m.dest, m.duration);
}
Iscroll.prototype.momentum = function () {
  var deceleration = 0.0004;
  var speed = this.speed;
  var destination = this.y + ( speed * speed ) / ( 2 * deceleration ) * ( this.distance < 0 ? -1 : 1 );
  var duration = speed / deceleration;
  var newY;
  if (destination > 0) {
    newY = 0;
  } else if (destination < this.viewHeight - this.height) {
    newY = this.viewHeight - this.height;
  }
  if (typeof newY === 'number') {
    duration = duration*(newY - this.y)/(destination - this.y);
    destination = newY;
  }
  if (this.y > 0 || this.y < this.viewHeight - this.height) {
    duration = 500;
  }
  var easing = 'out-circ';
  return {
    dest: destination,
    duration: duration
  }
}


Iscroll.prototype.scrollTo = function (y, duration, easing) {
  if (this.tween) this.tween.stop();
  var intransition = duration > 0;
  if (!intransition) {
    return this.translate(y);
  }

  easing = easing || 'out-quad';
  var tween = this.tween = Tween({y : this.y})
      .ease(easing)
      .to({y: y})
      .duration(duration)

  var self = this;
  tween.update(function(o) {
    self.translate(o.y);
  })

  tween.on('end', function () {
    animate = function(){};
  })

  function animate() {
    raf(animate);
    tween.update();
  }

  animate();
}

/**
 * Gets the appropriate "touch" object for the `e` event. The event may be from
 * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
 *
 * @api private
 */

Iscroll.prototype.getTouch = function(e){
  // "mouse" and "Pointer" events just use the event object itself
  var touch = e;
  if (e.changedTouches && e.changedTouches.length > 0) {
    // W3C "touch" events use the `changedTouches` array
    touch = e.changedTouches[0];
  }
  return touch;
}

/**
 * Set transition duration.
 *
 * @api private
 */

Iscroll.prototype.transitionDuration = function(ms){
  var s = this.el.style;
  s.webkitTransition = ms + 'ms -webkit-transform';
  s.MozTransition = ms + 'ms -moz-transform';
  s.msTransition = ms + 'ms -ms-transform';
  s.OTransition = ms + 'ms -o-transform';
  s.transition = ms + 'ms transform';
}

/**
 * Translate to `x`.
 *
 *
 * @api private
 */

Iscroll.prototype.translate = function(y) {
  var s = this.el.style;
  if (isNaN(y)) return;
  if (this.y !== y) {
    this.y = y;
    //only way for android 2.x to dispatch custom event
    var evt = document.createEvent('UIEvents');
    evt.initUIEvent('scroll', false, false, true, y);
    this.el.dispatchEvent(evt);
  }
  if (has3d) {
    s.webkitTransform = 'translate3d(0, ' + y + 'px' + ', 0)';
  } else {
    s.webKitTransform = 'translateY(' + y + 'px)';
  }
}

/**
 * Set transition duration to `ms`.
 *
 * @param {Number} ms
 * @return {Swipe} self
 * @api public
 */

Iscroll.prototype.duration = function(ms){
  this._duration = ms;
  return this;
}

/**
 * Sets the "touchAction" CSS style property to `value`.
 *
 * @api private
 */

Iscroll.prototype.touchAction = function(value){
  var s = this.el.style;
  if (touchAction) {
    s[touchAction] = value;
  }
}

module.exports = Iscroll;
