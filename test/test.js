/*global describe, it, beforEach, afterEach*/
var Iscroll = require('..')
var assert = require('assert')
var Touch = require('touch-simulate')

var scrollable

function assign(to, from) {
  Object.keys(from).forEach(function (k) {
    to[k] = from[k]
  })
  return to
}

function appendChildren(count) {
  var ul = scrollable.querySelector('ul.list')
  for (var i = 0; i < count; i ++) {
    var li = document.createElement('li')
    li.textContent = i
    ul.appendChild(li)
  }
}

beforeEach(function (done) {
  scrollable = document.createElement('div')
  assign(scrollable.style, {
    position: 'fixed',
    top: '50px',
    left: '0px',
    right: '0px',
    bottom: '0px'
  })
  document.body.appendChild(scrollable)
  var wrapper = document.createElement('div')
  scrollable.appendChild(wrapper)
  var ul = document.createElement('ul')
  ul.className = 'list'
  ul.style.margin = '0px'
  ul.style.padding = '0px'
  wrapper.appendChild(ul)
  setTimeout(done, 20)
})

afterEach(function () {
  document.body.removeChild(scrollable)
})

describe('Iscroll()', function () {
  it('should init with new', function () {
    var is = new Iscroll(scrollable)
    assert.equal(is.el, scrollable.firstChild)
  })

  it('should init without new', function () {
    var is = Iscroll(scrollable)
    assert.equal(is.el, scrollable.firstChild)
  })

  it('should init with option', function () {
    var is = Iscroll(scrollable, {
      handlebar: true
    })
    assert.equal(is.el, scrollable.firstChild)
  })

  it('should throw if scrollable have more than one child', function () {
    var err
    scrollable.appendChild(document.createElement('div'))
    try {
    var is = Iscroll(scrollable)
    } catch (e) {
      err = e
    }
    assert(!!err.message)
  })
})

describe('.refresh()', function () {
  it('should refresh when init', function () {
    var is = Iscroll(scrollable)
    var h = is.height
    assert(h != null)
  })

  it('should recalculate the height', function () {
    var is = Iscroll(scrollable)
    assert.equal(is.height, 0)
    appendChildren(20)
    var h = scrollable.querySelector('ul').getBoundingClientRect().height
    is.refresh()
    assert.equal(is.height, h)
  })
})

describe('touchstart', function () {
  it('should get the postion at start', function () {
    var x
    var y
    scrollable.addEventListener('touchstart', function (e) {
      x = e.touches[0].pageX
      y = e.touches[0].pageY
    })
    var is = Iscroll(scrollable)
    appendChildren(20)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 0})
    t.start()
    var down = is.down
    assert.equal(down.x, x)
    assert.equal(down.y, y)
    assert.equal(down.start, 0)
  })

  it('should show and resize handlebar at start', function () {
    var is = Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(30)
    is.refresh()
    var h = is.viewHeight * is.viewHeight/is.height
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 0})
    t.start()
    var s = is.handlebar.el.style
    assert(parseInt(s.height, 10) - h < 1)
    assert.notEqual(s.backgroundColor, 'rgba(0,0,0,0)')
  })
})

describe('touchmove', function() {
  it('should scroll when moving up', function () {
    var is = Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(90)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 80})
    var p = t.moveUp(10)
    return p.then(function () {
      var d = scrollable.scrollTop - 10
      assert(Math.abs(d) < 1)
    })
  })

  it('should not change scroll when moving right', function () {
    var is = Iscroll(scrollable)
    appendChildren(20)
    assert.equal(scrollable.scrollTop, 0)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 90})
    var p = t.move(Math.PI/10, 10)
    return p.then(function () {
      assert.equal(scrollable.scrollTop, 0)
    })
  })

  it('should not change scroll when moving left', function () {
    var is = Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(20)
    assert.equal(scrollable.scrollTop, 0)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 90})
    var p = t.move(Math.PI/5 + Math.PI, 10)
    return p.then(function () {
      assert.equal(scrollable.scrollTop, 0)
    })
  })

  it('should not change scroll when move up and view height bigger than content height', function () {
    var is = Iscroll(scrollable)
    appendChildren(5)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 90})
    var p = t.moveUp(10)
    return p.then(function () {
      assert.equal(scrollable.scrollTop, 0)
    })
  })

  it('should change scroll when move down and view height bigger than content height', function () {
    var is = Iscroll(scrollable)
    appendChildren(5)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 90})
    var dis = 10
    var p = t.moveDown(dis)
    return p.then(function () {
      assert(scrollable.scrollTop < 0)
    })
  })

  it('should restinct the scrollTop when scroll up', function () {
    var is = Iscroll(scrollable)
    appendChildren(5)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 100})
    var dis = 100
    var p = t.moveDown(dis)
    return p.then(function () {
      var top = scrollable.scrollTop
      // it's the upmost
      assert.equal(top, -80)
    })
  })

  it('should stop scrolling on touchstart', function () {
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 200})
    var dis = 40
    // 100 ms finish
    var p = t.moveDown(dis)
    return p.then(function () {
      t.start()
      return t.wait(10)
    }).then(function () {
      var top = Math.abs(scrollable.scrollTop)
      var d = Math.abs(top - dis)
      assert(d < 5)
    })
  })
})

describe('touchend', function() {
  it('should emit release event on touchend', function () {
    var is = Iscroll(scrollable)
    var fired
    appendChildren(80)
    is.refresh()
    is.on('release', function () {
      fired = true
    })
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var p = t.moveUp(10)
    return p.then(function () {
      assert.equal(fired, true)
    })
  })

  it('should move forward if more content ahead', function () {
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var p = t.moveUp(20)
    var d
    return p.then(function () {
      d = Math.abs(scrollable.scrollTop - 20)
      assert(d < 3)
      return t.wait(50)
    }).then(function () {
      assert(scrollable.scrollTop - 20 > d)
    })
  })

  it('should reset to the top after scrolling', function () {
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var p = t.moveDown(20)
    return p.then(function () {
      return t.wait(1000)
    }).then(function () {
      assert.equal(scrollable.scrollTop, 0)
    })
  })

  it('should not scroll when reached bottom', function () {
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var top = is.height = is.viewHeight
    is.scrollTo(top, 100, 'linear')
    t.wait(120).then(function () {
      assert.equal(is.y, top)
    }).then(function () {
      return t.moveUp(30)
    }).then(function () {
      assert.equal(is.y, top)
    })
  })
})

describe('emulate', function() {
  it('should scroll by set scrollTop', function () {
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    scrollable.scrollTop = 40
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return t.wait(210).then(function () {
      assert.equal(is.y, -40)
    })
  })

  it('should emit scroll event on scrollable', function () {
    var arr = []
    scrollable.addEventListener('scroll', function (e) {
      assert(e instanceof CustomEvent)
      arr.push(e)
    }, false)
    var is = Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return t.moveUp(40).then(function () {
      assert(arr.length > 0)
    })
  })
})

describe('.unbind()', function() {
  it('should unbind the event listeners', function () {
    var arr = []
    var is = Iscroll(scrollable)
    is.on('scroll', function (e) {
      arr.push(e)
    }, false)
    appendChildren(200)
    is.refresh()
    is.unbind()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return t.moveUp(40).then(function () {
      assert(arr.length === 0)
    })
  })

  it('should remove handlebar', function () {
    var arr = []
    var is = Iscroll(scrollable, {
      handlebar: true
    })
    is.on('scroll', function (e) {
      arr.push(e)
    }, false)
    appendChildren(200)
    is.refresh()
    is.unbind()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return t.moveUp(40).then(function () {
      assert(arr.length === 0)
      assert.equal(is.handlebar.el.parentNode, null)
    })
  })
})

