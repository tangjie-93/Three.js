import {init} from './shared-orbitcontrols.js';
import {ProxyManager} from "./ProxyManager.js";

const proxyManager = new ProxyManager();

function start(data) {
  const proxy = proxyManager.getProxy(data.canvasId);
  proxy.ownerDocument = proxy; // HACK!
  self.document = {};  // HACK!
  init({
    canvas: data.canvas,
    inputElement: proxy,
  });
}

function makeProxy(data) {
  proxyManager.makeProxy(data);
}

const handlers = {
  start,
  makeProxy,
  event: proxyManager.handleEvent,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (typeof fn !== 'function') {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
