const { EventEmitter } = require("metaverse-common");
const { Controls } = require("../controls");
const { Camera } = require("../camera");

class Scene extends EventEmitter {
  constructor() {
    super();
    this.controls = new Controls();
    this.camera = new Camera();
  }

  tick() {
    this.emit("tick");
  }
}

module.exports = {
  Scene
};
