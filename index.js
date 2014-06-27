var has3d = require('has-translate3d');
var touchAction = require('touchaction-property');
var events = require('events');
var styles = require('computed-style');
var transform = require('transform-property');
var Emitter = require('emitter');
var raf = require('raf');
var Tween = require('tween');
var max = Math.max;
var min = Math.min;
var now = Date.now || function () {
  return (new Date()).getTime();
}
var getterAndSetter = (typeof Object.__defineGetter__ === 'function' && typeof Object.__defineSetter__ === 'function');

var minSpeed = 0.01;

function lastVisible(el) {
  var nodes = el.childNodes;
  for(var i = nodes.length - 1; i >=0; i --) {
    var node = nodes[i];
    if (node.nodeType === 1 && node.style.display !== 'none') {
      return node;
    }
  }
}

function Iscroll(el, opts) {
  if (! (this instanceof Iscroll)) return new Iscroll(el, opts);
  this.y = 0;
  this.el = el;
  this.pb = parseInt(styles(el).getPropertyValue('padding-bottom'), 10);
  this.touchAction('none');
  this.el.style[transform + 'Style'] = 'preserve-3d';
  this.refresh();
  this.bind();
  var self = this;
  if (getterAndSetter) {
    this.__defineGetter__('scrollTop', function(){
      return - self.y;
    })
    this.__defineSetter__('scrollTop', function(v){
      return self.scrollTo(v, 200);
    })
  }
  this.autorefresh = opts.autorefresh === undefined ? true : opts.autorefresh;
  opts = opts || {};
  if (opts.handlebar) {
    var bar = this.handlebar = document.createElement('div');
    bar.className = 'iscroll-handlebar';
    this.el.parentNode.appendChild(bar);
  }
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

/**
 * recalculate height
 *
 * @api public
 */
Iscroll.prototype.refresh = function () {
  var child = lastVisible(this.el);
  this.viewHeight = parseInt(styles(this.el.parentNode).height, 10);
  var cb = child.getBoundingClientRect().bottom;
  var b = this.el.getBoundingClientRect().bottom;
  var h = parseInt(styles(this.el).height, 10);
  if (b - cb !== 0) {
    this.height = h + (cb - b) + this.pb;
  } else {
    this.height = h + this.pb;
  }
  this.el.style.height = this.height + 'px';
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
  if (this.autorefresh) this.refresh();
  this.dy = 0;
  this.ts = now();
  this.leftright = null;
  if (this.handlebar) this.resizeHandlebar();

  var touch = this.getTouch(e);
  this.pageY = touch.pageY;
  this.down = {
    x: touch.pageX,
    y: touch.pageY,
    start: this.y,
    at: now()
  };
}

Iscroll.prototype.ontouchmove = function (e) {
  e.preventDefault();
  if (!this.down || this.leftright) return;
  var touch = this.getTouch(e);
  // TODO: ignore more than one finger
  if (!touch) {
    return;
  }

  var down = this.down;
  var y = touch.pageY;
  this.dy = y - down.y;

  // determine dy and the slope
  if (null == this.leftright) {
    var x = touch.pageX;
    var dx = x - down.x;
    var slope = dx / this.dy;

    // if is greater than 1 or -1, we're swiping up/down
    if (slope > 1 || slope < -1) {
      this.leftright = true;
      if (this.handlebar) this.hideHandlebar();
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
}

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
  if (!this.down || this.leftright) return;
  var touch = this.getTouch(e);
  this.calcuteSpeed(touch.pageY);
  var m = this.momentum();
  this.scrollTo(m.dest, m.duration, m.ease);
  this.emit('release', this.y);
  this.down = null;
}

Iscroll.prototype.momentum = function () {
  var deceleration = 0.0005;
  var speed = this.speed;
  speed = min(speed, 1.1);
  var destination = this.y + ( speed * speed ) / ( 2 * deceleration ) * ( this.distance < 0 ? -1 : 1 );
  var duration = speed / deceleration;
  var newY, ease;
  if (destination > 0) {
    newY = 0;
    ease = 'out-back';
  } else if (destination < this.viewHeight - this.height) {
    newY = this.viewHeight - this.height;
    ease = 'out-back';
  }
  if (typeof newY === 'number') {
    duration = duration*(newY - this.y + 160)/(destination - this.y);
    destination = newY;
  }
  if (this.y > 0 || this.y < this.viewHeight - this.height) {
    duration = 500;
    ease = 'out-circ';
  }
  return {
    dest: destination,
    duration: duration,
    ease: ease
  }
}


Iscroll.prototype.scrollTo = function (y, duration, easing) {
  if (this.tween) this.tween.stop();
  var intransition = (duration > 0 && y !== this.y);
  if (!intransition) {
    this.onScrollEnd();
    return this.translate(y);
  }

  easing = easing || 'out-circ';
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
    if (!tween.stopped) {
      self.onScrollEnd();
    }
  })

  function animate() {
    raf(animate);
    tween.update();
  }

  animate();
}

Iscroll.prototype.onScrollEnd = function () {
  this.hideHandlebar();
  var top = this.y === 0;
  var bottom = this.y === (this.viewHeight - this.height);
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
  var touch = e;
  if (e.changedTouches && e.changedTouches.length > 0) {
    // W3C "touch" events use the `changedTouches` array
    touch = e.changedTouches[0];
  }
  return touch;
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
  y = Math.floor(y);
  //reach the end
  if (this.y !== y) {
    this.y = y;
    this.emit('scroll', - y);
    if (this.handlebar) this.transformHandlebar();
  }
  if (has3d) {
    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)';
  } else {
    s[transform] = 'translateY(' + y + 'px)';
  }
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

Iscroll.prototype.transformHandlebar = function(){
  var vh = this.viewHeight;
  var h = this.height;
  var bh = vh - vh * vh/h;
  var ih = h - vh;
  var y = parseInt(- bh * this.y/ih);
  var s = this.handlebar.style;
  if (has3d) {
    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)';
  } else {
    s[transform] = 'translateY(' + y + 'px)';
  }
}

/**
 * show the handlebar and size it
 * @api public
 */
Iscroll.prototype.resizeHandlebar = function(){
  var h = this.viewHeight * this.viewHeight/this.height;
  this.handlebar.style.height = h + 'px';
  this.handlebar.style.backgroundColor = 'rgba(0,0,0,0.3)';
}

Iscroll.prototype.hideHandlebar = function () {
  if (this.handlebar) this.handlebar.style.backgroundColor = 'transparent';
}

module.exports = Iscroll;
