1.7.0
* add auto refresh option.

1.6.3
* refresh on mouse wheel.

1.6.2
* no mocha on deps

1.6.1
* allow other absolute positioned children for scrollable

1.6.0
* add direction for last scroll direction

1.5.1
* fix scroll end event for mouse wheel.

1.5.0
* add mouse wheel support

1.4.0
* inner element at least scrollable element height

1.3.4
* fix scroll animation

1.3.3
* no touch detect

1.3.2
* scrollTo miny if over scrolled on refresh

1.3.1
* limit scroll speed

1.3.0
* improve css style
* increase deceleration

1.2.2
* fix toushstart down.at

1.2.1
* emit start event

1.2.0
* scrollTo return promise

1.1.10
* bind touch events to scrollable
* some code refactor

1.1.9
* add max option

1.1.8
* refresh on touchstart

1.1.7
* no move if dy is 0

1.1.6
* improve height calculate

1.1.5
* add documentation

1.1.4
* fix unbind not remove handlebar

1.1.3
* bind touchcancel event with document

1.1.2
* Fix not works well when height < viewHeight

1.1.1
* Use user defined element for scroll

1.0.1
* Not fail if CustomEvent can not create

1.0.0
* Use the correct scrollable element
* Fire custom scroll and set scrollTop to the scrollable correctly
* Fix the animation on handle bar

0.1.9
* use style field in package.json

0.1.8
* use Object.defineProperty for element scrollTop
* support using with webpack & browserify

0.1.7
* improve: use computed-style to check visiability.
* fix: unbind function would remove all event listeners and remove handlebar.

0.1.6
* improve: refresh on orientation change

0.1.5
* improve: make scroll more smoothly

0.1.4
* fix: clear this.down on touchend

0.1.3
* fix: emit `release` after trigger transition.

0.1.2
* improve: add `autorefresh` option, set to false to disable autorefresh.

0.1.1
* fix `onscrollend` doesn't fire.

0.1.0

* remove `scrollTop` and `scroll` event emulate on scrollable element.
* add `scroll` and `scrollend` event
* handlebar animation improvement.

0.0.7

* add handlebar
* add scroll debounce
