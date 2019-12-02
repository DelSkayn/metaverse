// Class for isolating scripts some what
// Each script runs in its own iframe which means it has less direct
// access to the DOM of the main document

const { Thread, Patch } = require("../thread");

class Module {
  constructor() {
    this._thread = new Thread();
    this._patch = new Patch(this._thread);
  }

  addScript(src) {
    this._thread.run(src);
  }

  emit(name, data) {
    this._thread.emit(name, data);
  }

  async tick() {
    let prom = this._thread.once("finishTick");
    this._thread.emit("tick");
    await prom;
  }

  mutValue(name, cb) {
    this._patch.mut(name, cb);
  }

  getValue(name) {
    this._patch.get(name);
  }

  get scene() {
    this._patch.get("scene");
  }

  mutCamera(cb) {
    this._patch.mut("camera", cb);
  }

  mutScene(cb) {
    this._patch.mut("scene", cb);
  }

  get camera() {
    this._patch.get("camera");
  }

  get context() {
    debugger;
    return this.frame.contentWindow;
  }
}

module.exports = {
  Module
};
