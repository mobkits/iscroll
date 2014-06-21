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

function lastVisible(el) {
  var nodes = el.childNodes;
  for(var i = nodes.length - 1; i >=0; i --) {
    var node = nodes[i];
    if (node.nodeType === 1 && node.style.display !== 'none') {
      return node;
    }
  }
}


function Iscroll(el) {
  if (! (this instanceof Iscroll)) return new Iscroll(el);
  this.y = 0;
  this.el = el;
  this.pb = parseInt(styles(el).getPropertyValue('padding-bottom'), 10);
  this.touchAction('none');
  this.refresh();
  this.bind();
  var self = this;
  this.el.__defineGetter__('scrollTop', function(){
    return - self.y;
  })
  this.el.__defineSetter__('scrollTop', function(v){
    return self.scrollTo(v, 200);
  })
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
  this.refresh();
  this.dy = 0;
  this.ts = now();
  this.leftright = null;

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
  this.emit('release', this.y);
  this.calcuteSpeed(touch.pageY);
  var m = this.momentum();
  this.scrollTo(m.dest, m.duration);
}

Iscroll.prototype.momentum = function () {
  var deceleration = 0.0005;
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
  return {
    dest: destination,
    duration: duration
  }
}


Iscroll.prototype.scrollTo = function (y, duration, easing) {
  if (this.tween) this.tween.stop();
  var intransition = (duration > 0 && y !== this.y);
  if (!intransition) {
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
