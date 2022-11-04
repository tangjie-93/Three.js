import {EventDispatcher} from '../../../js/three.js';

function noop() {}
export class ElementProxyReceiver extends EventDispatcher {
    constructor() {
      super();
      // because OrbitControls try to set style.touchAction;
      this.style = {};
    }
    get clientWidth() {
      return this.width;
    }
    get clientHeight() {
      return this.height;
    }
    // OrbitControls call these as of r132. Maybe we should implement them
    setPointerCapture() { }
    releasePointerCapture() { }
    getBoundingClientRect() {
      return {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        right: this.left + this.width,
        bottom: this.top + this.height,
      };
    }
    handleEvent(data) {
      if (data.type === 'size') {
        this.left = data.left;
        this.top = data.top;
        this.width = data.width;
        this.height = data.height;
        return;
      }
      data.preventDefault = noop;
      data.stopPropagation = noop;
      this.dispatchEvent(data);
    }
    focus() {
      // no-op
    }
  }