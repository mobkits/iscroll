# iscroll

Make element scroll on android `scroll` event is fired with `e.detail === translateY` when scrolling.

The only target platform is **Android > 2.3**

Instead of making the library works every where, the goal is **high performance** and easy to use, while keep the code simplity.

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

scroll.on('release', function(y) {
  console.log('tranlateY: ' + y);
})

el.on('scroll', function(e) {
  //e.target == el
  console.log('tranlateY:' + e.detail);
})
```

## API

`release` event is fired with y (translated) on touchend.

### iscroll(el)

Init iscroll with el.

### .refresh()

Recalculate element height, call this after element height changed. (called automatically on touchstart).

### .scrollTo(y, [duration])

Set translateY to `y` with optional duration(ms)

## License

MIT
