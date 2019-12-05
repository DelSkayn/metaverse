const { EventEmitter } = require("metaverse-common");
const { Patch } = require("./patch");
const THREE = require("three");

class Thread extends EventEmitter {
  constructor(w) {
    this._worker = w;
    this._worker.onmessage = this._handleMessage.bind(this);
    this._emit = super.emit;
  }

  _handleMessage(x) {
    this._emit(x.data.name, x.data.data);
  }

  emit(name, data) {
    this._worker.postMessage({
      name,
      data
    });
  }
}

module.exports = x => {
  const context = new Thread(x);
  context.on("script", x => {
    Function(x)();
  });
};
