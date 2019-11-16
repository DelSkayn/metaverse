const { Vector3 } = require("three");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");

/// Manages connections to servers servers
class Servers {
  constructor(controlsContext) {
    this.controlsContext = controlsContext;
    this._currentChunk = new Vector3();
    this._connections = [];
    this._current = null;
  }

  async load(mainCamera) {
    const servers = await getServers(mainCamera.position);

    servers.forEach(x => {
      this._connections.push(new ServerConnection(x, this.controlsContext));
    });

    let promises = [];
    // Load initial script
    this._connections.forEach(x => {
      promises.push(
        x.load().then(async () => {
          // If this server is the one the client is in
          // connect to the server;
          if (x.server.isWithin(mainCamera.position)) {
            this._current = x;
            await this._current.connect();
          }
        })
      );
    });
    await Q.all(promises);
  }

  /// Update which server has the right control
  updatePosition(mainCamera) {
    const pos = mainCamera.position.clone();
    pos.multiplyScalar(0.1);
    pos.round();
    if (this._currentChunk.equals(pos)) {
      return;
    }
    this._currentChunk = pos;
    if (this._current && this._current.server.isWithin(pos)) {
      return;
    }
    console.log("changed!");
    if (this._current) {
      this._current.disconnect();
    }
    this._current = null;
    this._connections.forEach(x => {
      if (x.server.isWithin(this._currentChunk)) {
        this._current = x;
        if (this._current.scene.camera) {
          this._current.scene.camera.copy(mainCamera);
        }
        this._current.connect();
      }
    });
  }

  /// Update the current server
  tick(mainCamera) {
    if (this.current) {
      const scene = this.current.scene;
      scene.tick();
      if (scene.camera) {
        mainCamera.copy(scene.camera);
      }
    }
  }

  render(renderer) {
    for (let i = 0; i < this.all.length; i++) {
      if (this.all[i].scene.root) {
        renderer.roots.add(this.all[i].scene.root);
      }
    }
    renderer.render();
    for (let i = 0; i < this.all.length; i++) {
      if (this.all[i].scene.root) {
        renderer.roots.remove(this.all[i].scene.root);
      }
    }
  }

  get current() {
    return this._current;
  }

  get all() {
    return this._connections;
  }
}

module.exports = {
  Servers
};
