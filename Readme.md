# iscroll

[![NPM version](https://img.shields.io/npm/v/iscroll-component.svg?style=flat-square)](https://www.npmjs.com/package/iscroll-component)
[![Dependency Status](https://img.shields.io/david/chemzqm/iscroll.svg?style=flat-square)](https://david-dm.org/chemzqm/iscroll)
[![Build Status](https://img.shields.io/travis/chemzqm/iscroll/master.svg?style=flat-square)](http://travis-ci.org/chemzqm/iscroll)
[![Coverage Status](https://img.shields.io/coveralls/chemzqm/iscroll/master.svg?style=flat-square)](https://coveralls.io/github/chemzqm/iscroll?branch=master)

Improve the scrollable element in both ios and android.

The goal of this library is **high performance** and easy to use, while keep the code simplity.

The scroll element is automatically refreshed when window resize or orientation change

Tested on **Android > 2.2** and **IOS > 6**

[demo](http://chemzqm.github.io/iscroll/)

[click here](https://github.com/chemzqm/iscroll/blob/master/supported.tsv) to see what device/os_version should be supported.

This library need `Object.defineProperty` and `CustomEvent` to work properly, if not exsit, the element hack (scrollTop and scroll event) would not available

## Installation

    $ npm install iscroll-component

You may need [webpack](https://webpack.github.io/) to build this lib

## Example

``` html
<div class="scrollable">
  <div>
    <ul>
    </ul>
  </div>
</div>
```
There should have a sinlge child of the scrollable element for iscroll to work with.

```js
var Iscroll = require('iscroll');
var el = document.getElementById('scrollable');
var scroll = new Iscroll(el);
el.addEventListener('scroll', function(e) {
  console.log(el.scrollTop);
}, false);
```

## API

* `start` event is fired with y (translated) on scroll start.

* `release` event is fired with y (translated) on touchend.

* `scroll` event is fired with y (Just as scrollTop on the element) on scroll.

* `scrollend` event is fired with Object containing `top` and `bottom` indicate whether the element has scrolled to top or bottom.

### iscroll(el, [opts])

Init iscroll with el and optional opts, set `opts.handlebar` to true if you want handlebar.

* `opts.handlerbar` show handlerbar if ture, remember to copy the css file
* `opts.max` set maxium translateY default 80

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
