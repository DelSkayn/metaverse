const immer = require("immer");

class Patch {
  constructor(channel) {
    this._channel = channel;
    this._state = {};
  }

  get(name) {
    if (this._state[name] === undefined) {
      this._state[name] = Object.freeze({});
    }
    return this._state[name];
  }

  mut(name, cb) {
    if (this._state[name] === undefined) {
      this._state[name] = Object.freeze({});
    }
    this._state[name] = immer.produce(this._state[name], cb, patch => {
      this._channel.emit("patch", {
        name,
        patch
      });
    });
  }
}

module.exports = {
  Patch
};
