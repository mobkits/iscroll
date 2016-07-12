import {has3d, transform} from 'prop-detect';

/**
 * Handlebar contructor
 *
 * @param {Element} scrollable
 * @contructor
 * @api public
 */
class handlebar {
  constructor(scrollable, className) {
    const el = this.el = document.createElement('div');
    el.className = className || 'iscroll-handlebar'
    scrollable.appendChild(el)
  }

  /**
   * Show the handlebar and resize it
   *
   * @param {Number} h
   * @api public
   */
  resize(h) {
    const s = this.el.style;
    s.height = `${h}px`
    s.backgroundColor = 'rgba(0,0,0,0.4)'
  }

  /**
   * Hide this handlebar
   *
   * @api public
   */
  hide() {
    this.el.style.backgroundColor = 'transparent'
  }

  /**
   * Move handlebar by translateY
   *
   * @param {Number} y
   * @api public
   */
  translateY(y) {
    const s = this.el.style;
    if (!transform) {
      s.top = `${y}px`
    } else {
      if (has3d) {
        s[transform] = `translate3d(0, ${y}px, 0)`
      } else {
        s[transform] = `translateY(${y}px)`
      }
    }
  }
}

export default handlebar;
