/*global describe, it, beforeEach, afterEach*/
var Iscroll = require('../src/index.js')
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

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(ms)
    }, ms)
  })
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
    var is = new Iscroll(scrollable)
    assert.equal(is.el, scrollable.firstChild)
  })

  it('should init with option', function () {
    var is = new Iscroll(scrollable, {
      handlebar: true
    })
    assert.equal(is.el, scrollable.firstChild)
  })

})

describe('.refresh()', function () {
  it('should refresh when init', function () {
    var is = new Iscroll(scrollable)
    var h = is.height
    assert(h != null)
  })

  it('should recalculate the height', function (done) {
    var is = new Iscroll(scrollable)
    assert(is.height < 10)
    appendChildren(100)
    setTimeout(function () {
      var h = scrollable.querySelector('ul').getBoundingClientRect().height
      is.refresh()
      assert.equal(is.height, h)
      done()
    }, 30)
  })
})

describe('touchstart', function () {
  it('should get the onstart function at start', function () {
    var is = new Iscroll(scrollable)
    appendChildren(20)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 0})
    t.start()
    assert.equal(typeof is.onstart, 'function')
  })

  it('should show and resize handlebar if started', function () {
    var is = new Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(200)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 200})
    // no fire touchend
    return t.start().moveDown(50, false).then(function () {
      is.refresh()
      var h = is.viewHeight * is.viewHeight/is.height
      var s = is.handlebar.el.style
      assert(parseInt(s.height, 10) < h)
      assert.notEqual(s.backgroundColor, 'rgba(0,0,0,0)')
    })
  })
})

describe('touchmove', function() {

  it('should scroll back when reached bottom', function () {
    var is = new Iscroll(scrollable)
    appendChildren(100)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 200})
    var top = is.height - is.viewHeight
    is.scrollTo(- top, 100, 'linear')
    return t.wait(300).then(function () {
      assert.equal(is.y, - top)
    }).then(function () {
      t.start()
      return t.moveUp(30)
    }).then(function () {
      return delay(1000)
    }).then(function () {
      assert.equal(- is.y, top)
    })
  })

  it('should scroll up and reset if content height less than scrollable height', function () {
    var is = new Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(2)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 300})
    t.start()
    var p = t.moveDown(30)
    return p.then(function () {
      assert(is.y > 0)
    }).then(function () {
      is.once('scrollend', function () {
        assert.equal(is.y, 0)
      })
    })
  })

  it('should scroll when moving up', function () {
    var is = new Iscroll(scrollable, {
      handlebar: true
    })
    appendChildren(200)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 80})
    var p = t.moveUp(10)
    return p.then(function () {
      var d = scrollable.scrollTop - 10
      assert(Math.abs(d) < 5)
    })
  })

  it('should not change scroll when moving right', function () {
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable, {
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

  it('should reset scrollTop if start stat is invalid', function () {
    var is = new Iscroll(scrollable)
    appendChildren(1)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 90})
    var p = t.moveUp(80, false)
    return p.then(function () {
      assert(scrollable.scrollTop > 60)
      t.el = scrollable
      t.start()
      return new Promise(function (resolve) {
        setTimeout(function () {
          assert.equal(scrollable.scrollTop, 0)
          resolve()
        }, 300)
      })
    })
  })

  it('should change scroll when move down and view height bigger than content height', function () {
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable)
    appendChildren(5)
    is.refresh()
    assert.equal(scrollable.scrollTop, 0)
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 200})
    var dis = 200
    var p = t.moveDown(dis)
    return p.then(function () {
      // it's the default upmost
      assert(is.y <= 80)
    })
  })

  it('should stop scrolling on touchstart', function () {
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var p = t.moveUp(20)
    var d
    return p.then(function () {
      d = Math.abs(scrollable.scrollTop - 20)
      assert(d < 3)
      return t.wait(200)
    }).then(function () {
      assert(scrollable.scrollTop - 20 > d)
    })
  })

  it('should reset to the top after scrolling', function () {
    var is = new Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return is.scrollTo(-30, 100).then(function () {
      var p = t.moveDown(28)
      return p.then(function () {
        return t.wait(600)
      }).then(function () {
        assert.equal(is.y, 0)
      })
    })
  })

  it('should reset to bottom after scrolling', function () {
    var is = new Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    var minY = is.minY
    return is.scrollTo(minY + 30, 100).then(function () {
      var p = t.moveUp(28)
      return p.then(function () {
        return t.wait(600)
      }).then(function () {
        assert(Math.abs(is.y - minY) < 10)
      })
    })
  })
})

describe('simulate', function() {
  it('should scroll by set scrollTop', function () {
    var is = new Iscroll(scrollable)
    appendChildren(200)
    is.refresh()
    scrollable.scrollTop = 40
    var li = scrollable.querySelector('ul > li:first-child')
    var t = Touch(li, {speed: 400})
    return t.wait(300).then(function () {
      assert(Math.abs(is.y + 40) < 5)
    })
  })

  it('should emit scroll event on scrollable', function () {
    var arr = []
    scrollable.addEventListener('scroll', function (e) {
      assert(e instanceof CustomEvent)
      arr.push(e)
    }, false)
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable)
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
    var is = new Iscroll(scrollable, {
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

// vim:set et sw=2 ts=2 tw=80 foldlevel=0:
