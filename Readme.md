# iscroll

Make element scrollable on android `scroll` event is fired and `el.scrollTop` is the value of scrolled top distance when scrolling.

For most times, what you need to do is init that instance by `iscroll(el)`, it would works as a scrollable element if you only need `scroll` event and `el.scrollTop`

Instead of making the library works every where, the goal is **high performance** and easy to use, while keep the code simplity.

Tested on **Android > 2.2**, some webview would add a scrollbar by default, you can add `overflow:hidden` to the target element, notice that may have some side effect.

We can't use custom `scrollTop` on safari, so be careful if you need to support ios.

TODO: add scrollbar.

[demo](http://chemzqm.github.io/iscroll/)

## Installation

Install with [component(1)](http://component.io):

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

`release` event is fired with y (translated) on touchend.

### iscroll(el)

Init iscroll with el.

### .refresh()

Recalculate element height, call this after element height changed. (called automatically on touchstart).

### .scrollTo(y, [duration])

Set translateY to `y` with optional duration(ms), called when you set `el.scrollTop`.

## License

MIT
