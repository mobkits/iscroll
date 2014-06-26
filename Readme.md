# iscroll

Make element scrollable using touch events.

Instead of making the library works every where, the goal is **high performance** and easy to use, while keep the code simplity.

Tested on **Android > 2.2**, some webview would add a scrollbar by default, you can add `overflow:hidden` to the target element, notice that may have some side effect.

[demo](http://chemzqm.github.io/iscroll/)

[click here](https://github.com/chemzqm/iscroll/blob/master/supported.tsv) to see what device/os_version should be supported.

## Known issue

* not works well on some old device when the device is not fully started (eg: CoolPad8070)

## Installation

Install with [component(1)](http://component.io):

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

`release` event is fired with y (translated) on touchend.

### iscroll(el)

Init iscroll with el.

### .refresh()

Recalculate element height, call this after element height changed. (called automatically on touchstart).

### .scrollTo(y, [duration])

Set translateY to `y` with optional duration(ms), called when you set `el.scrollTop`.

## License

MIT
