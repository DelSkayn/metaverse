const work = require("webworkify");
const { EventEmitter } = require("metaverse-common");
const immer = require("immer");

// A class which manages the syncronization of objects over a channel via patches.
// # Events
// - Value Name: Emitted when a value with that name recieved a change from a remote source. Value passed to arguments.
class Patch extends EventEmitter {
  constructor(channel) {
    super();
    this._state = {};
    this._callbacks = {};
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
    this.emit(data.name, this._state[name]);
  }

  get(name) {
    return this._state[name];
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
    this._worker.addEventListener("message", this._handleMessage.bind(this));
    this._emit = super.emit.bind(this);
  }

  run(fn) {
    let script = fn;
    if (typeof fn === "function") {
      script = "(" + fn.toString() + ")()";
    }
    this.emit("script", script);
  }

  _handleMessage(msg) {
    console.log(msg);
    console.log(this);
    this._emit(msg.data.name, msg.data.data);
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
