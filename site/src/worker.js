const THREE = require("three");
const GLTFLoader = require("three-gltf-loader");
const { EventEmitter } = require("metaverse-common");
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

class Scene {
  constructor(patch, thread) {
    this._patch = patch;
    this._thread = thread;
  }

  updateScene(cb) {
    this._patch.mut("scene", cb);
  }
}

function run(x) {
  self.THREE = THREE;
  self.GLTFLoader = GLTFLoader;
  self.thread = new Thread(x);
  self.patch = new Patch(thread);
  self.window = self;
  self.scene = new Scene(patch);
  thread.on("init", x => {
    self.url = x.url;
    self.URL = x.url;
  });
  thread.on("script", x => {
    Function(x)();
  });
}

module.exports = run;
