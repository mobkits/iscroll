# iscroll

Make element scroll on android < 3, `scroll` event is fired with `e.detail === translateY` when scrolling.

[demo](http://chemzqm.github.io/iscroll/)

## Installation

Install with [component(1)](http://component.io):

    $ component install chemzqm/iscroll

## Example

```js
var iscroll = require('iscroll');
if (android_version < 3) {
  iscroll(el);
}
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
