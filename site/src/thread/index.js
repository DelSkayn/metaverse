const { EventEmitter } = require("metaverse-common");
const work = require("webworkify");

class Thread extends EventEmitter {
  constructor(fn) {
    this._worker = work(require("./worker"));
    this._worker.onmessage = this._handleMessage.bind(this);
    this._emit = super.emit();
  }

  _handleMessage(x) {
    const data = x.data;
    this._emit(data.name, data.data);
  }

  emit(name, data) {
    this._worker.postMessage({
      name,
      data
    });
  }
}

module.exports = {
  Thread
};
