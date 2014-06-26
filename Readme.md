# iscroll

Make element scrollable using touch events.

The goal of this library is **high performance** and easy to use, while keep the code simplity.

Tested on **Android > 2.2** and **IOS > 6**, some webview would add a scrollbar by default, you can add `overflow:hidden` to the target element, notice that may have some side effect.

[demo](http://chemzqm.github.io/iscroll/)

[click here](https://github.com/chemzqm/iscroll/blob/master/supported.tsv) to see what device/os_version should be supported.

## Known issue

* not works well on some old device when the device is not fully started (eg: CoolPad8070)

## Installation

Include file [iscroll.js](https://raw.githubusercontent.com/chemzqm/iscroll/master/iscroll.js) and [iscroll.css](https://raw.githubusercontent.com/chemzqm/iscroll/master/iscroll.css) if you want to use standalone version.

Or install with [component(1)](http://component.io):

    $ component install chemzqm/iscroll

## Example


```js
var Iscroll = require('iscroll');
var el = document.getElementById('scrollable');
var scroll = new Iscroll(el);
scroll.on('scroll', function(e) {
  console.log(scroll.scrollTop);
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

## License

MIT
