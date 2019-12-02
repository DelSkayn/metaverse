const work = require("webworkify");
const { EventEmitter } = require("metaverse-common");
const immer = require("immer");

class Patch {
  constructor(channel) {
    this._state = {};
    this._channel = channel;
    this._onChange = null;
    channel.on("patch", this._patch.bind(this));
  }

  _patch(data) {
    if (this._state[data.name] === undefined) {
      this._state[data.name] = {};
    }
    this._state[data.name] = immer.applyPatches(
      this._state[data.name],
      data.patch
    );
    if (this._onChange) {
      this._onChange(data.name, this._state[data.name]);
    }
  }

  get(name) {
    return this._state[name];
  }

  onChange(cb) {
    this._onChange = cb;
  }

  mut(name, cb) {
    if (this._state[name] === undefined) {
      this._state[name] = {};
    }
    this._state[name] = immer.produce(this._state[name], cb, patch => {
      this._channel.emit("patch", {
        name,
        patch
      });
    });
  }
}

class Thread extends EventEmitter {
  constructor() {
    super();
    this._worker = work(require("./worker.js"));
    this._worker.addEventListener("message", this._handleMessage);
  }

  run(fn) {
    let script = fn;
    if (typeof fn === "function") {
      script = "(" + fn.toString() + ")()";
    }
    this.emit("script", script);
  }

  _handleMessage(msg) {
    super.emit(msg.data.name, msg.data.data);
  }

  emit(name, data) {
    this._worker.postMessage({
      name,
      data
    });
  }
}

module.exports = {
  Patch,
  Thread
};
