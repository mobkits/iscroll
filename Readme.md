# iscroll

Improve the scrollable element in both ios and android.

The goal of this library is **high performance** and easy to use, while keep the code simplity.

The scroll element is automatically refreshed when window resize or orientation change

Tested on **Android > 2.2** and **IOS > 6**

[demo](http://chemzqm.github.io/iscroll/)

[click here](https://github.com/chemzqm/iscroll/blob/master/supported.tsv) to see what device/os_version should be supported.

## Installation

Include file [iscroll.js](https://raw.githubusercontent.com/chemzqm/iscroll/master/iscroll.js) and [iscroll.css](https://raw.githubusercontent.com/chemzqm/iscroll/master/iscroll.css) if you want to use standalone version.

It's prefered to install with npm:

    $ npm install iscroll-component

then use webpack or browserify, or install with [component(1)](http://component.io):

    $ component install chemzqm/iscroll

## Example


```js
var Iscroll = require('iscroll');
var el = document.getElementById('scrollable');
var scroll = new Iscroll(el);
el.addEventListener('scroll', function(e) {
  console.log(el.scrollTop);
}, false);
```

## API

* `release` event is fired with y (translated) on touchend.

* `scroll` event is fired with y (Just as scrollTop on the element) on scroll.

* `scrollend` event is fired with Object containing `top` and `bottom` indicate whether the element has scrolled to top or bottom.

### iscroll(el, [opts])

Init iscroll with el and optional opts, set `opts.handlebar` to true if you want handlebar.

### .refresh()

Recalculate element height, call this after element height changed. (called automatically on touchstart).

### .scrollTo(y, [duration])

Set translateY to `y` with optional duration(ms), called when you set `el.scrollTop`.

## Test
  npm install
  gulp
  http://localhost:8080/example/index.html

## License

MIT
