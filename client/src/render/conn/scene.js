const { EventEmitter } = require("metaverse-common");
const { Controls } = require("../controls");
const { Camera } = require("../camera");
const { _ } = require("lodash");

class Scene extends EventEmitter {
  constructor(controlsContext) {
    super();
    this._bindings = [];
    this.controlsContext = controlsContext;
  }

  tick() {
    this.emit("tick");
  }

  bind(binding) {
    this._bindings.push(binding);
    this.controlsContext.bind(binding);
  }

  unbind(binding) {
    _.remove(this._bindings, x => x == binding);
    this.controlsContext.unbind(binding);
  }

  connect(rpc) {
    for (let i = 0; i < this._bindings.length; i++) {
      this.controlsContext.bind(this._bindings[i]);
    }
    this.emit("connect", rpc);
  }

  disconnect() {
    for (let i = 0; i < this._bindings.length; i++) {
      this.controlsContext.unbind(this._bindings[i]);
    }
    this.emit("disconnect");
  }
}

module.exports = {
  Scene
};
