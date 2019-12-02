const THREE = require("three");
const GLTFLoader = require("three-gltf-loader");
const { EventEmitter } = require("metaverse-common");
const { Camera } = require("./camera");
const { Controls, BaseControls } = require("./controls");
const { Patch } = require("./thread");

class Thread extends EventEmitter {
  constructor(channel) {
    super();
    this._channel = channel;
    this._channel.addEventListener("message", this._handleMessage.bind(this));
    this.on("run", this._run);
  }

  _handleMessage(msg) {
    console.log(msg.data);
    super.emit(msg.data.name, msg.data.data);
  }

  emit(name, data) {
    this._channel.postMessage({
      name,
      data
    });
  }
}

function run(x) {
  self.thread = new Thread(x);
  self.patch = new Patch(thread);
  thread.on("script", x => {
    Function(x)();
  });
}

module.exports = run;
