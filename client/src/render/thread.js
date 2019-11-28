const { EventEmitter } = require("metaverse-common");

class WorkerThread extends EventEmitter {
  constructor() {
    super();
    onmessage = x => {
      super.emit(x.data.name, x.data.data);
    };
  }

  emit(name, data) {
    postMessage({
      name,
      data
    });
  }
}

class Thread extends EventEmitter {
  constructor(fn) {
    super();
    const src =
      EventEmitter.toString() +
      WorkerThread.toString() +
      "const Worker = new WorkerThread();" +
      "(" +
      fn.toString() +
      ")()";

    console.log(src);

    const blob = new Blob([src], {
      type: "application/javascript"
    });
    this._worker = new Worker(URL.createObjectURL(blob));
    this._worker.onmessage = (x => {
      console.log(x);
      super.emit(x.data.name, x.data.data);
    }).bind(this);
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
