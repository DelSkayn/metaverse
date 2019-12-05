const { Vector3 } = require("three");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const Q = require("q");

/// Manages connections to servers servers
class Servers {
  constructor(controlsContext, userName, node) {
    this.controlsContext = controlsContext;
    this._currentChunk = new Vector3();
    this._connections = [];
    this._current = null;
    this._shouldConnect = null;
    this._username = userName;
    this._node = node;
    this.showAll = false;
  }

  async load(mainCamera) {
    this.servers = await getServers(mainCamera.position);

    this.servers.forEach(x => {
      this._connections.push(
        new ServerConnection(x, this.controlsContext, this._username)
      );
    });

    let promises = [];
    // Load initial script
    this._connections.forEach(x => {
      promises.push(
        x
          .load()
          .then(async () => {
            // If this server is the one the client is in
            // connect to the server;
            if (x.server.isWithin(mainCamera.position)) {
              this._current = x;
              await this._current.connect();
              if (!this._current) {
                return;
              }
              this._current.onId(
                (x => {
                  console.log(x);
                  this._node.addConnection(x);
                }).bind(this)
              );
              this._current.sendId(this._node.peer.id);
            }
          })
          .catch(e => {
            console.error("error loading '" + x.server.addr + "':  " + e);
          })
      );
    });
    await Q.all(promises);
  }

  calcChunkPos(position) {
    const pos = position.clone();
    pos.multiplyScalar(0.1);
    pos.floor();
    return pos;
  }

  /// Update which server has the right control
  updatePosition(mainCamera) {
    const pos = this.calcChunkPos(mainCamera.position);
    if (this._currentChunk.equals(pos)) {
      return;
    }
    this._currentChunk = pos;
    if (this._current && this._current.server.isWithin(pos)) {
      return;
    }
    if (this._current) {
      this._current.disconnect();
    }
    this._current = null;
    this._connections.forEach(x => {
      if (x.server.isWithin(this._currentChunk)) {
        this._current = x;
        if (this._current.scene && this._current.scene.camera) {
          this._current.scene.camera.copy(mainCamera);
        }
        this._current.connect().then(
          (() => {
            if (!this._current) {
            }
            this._current.onId(
              (x => {
                console.log(x);
                this._node.addConnection(x);
              }).bind(this)
            );
            this._current.sendId(this._node.peer.id);
          }).bind(this)
        );
      }
    });
  }

  /// Update the current server
  tick(mainCamera) {
    if (this.current && this.current.scene) {
      const scene = this.current.scene;
      if (scene.camera) {
        scene.camera.copy(mainCamera);
      }
      scene.tick();
      if (scene.camera) {
        mainCamera.copy(scene.camera);
      }
    }
  }

  render(renderer) {
    for (let i = 0; i < this.all.length; i++) {
      if (this.all[i].scene && this.all[i].scene.root) {
        const scene = this.all[i].scene.root;
        if (!this.showAll) {
          this._checkSceneValid(scene, this.all[i].server);
        } else {
          scene.traverse(x => (x.visible = true));
        }
        renderer.roots.add(this.all[i].scene.root);
      }
    }
    renderer.render();
    for (let i = 0; i < this.all.length; i++) {
      if (this.all[i].scene && this.all[i].scene.root) {
        renderer.roots.remove(this.all[i].scene.root);
      }
    }
  }

  _checkSceneValid(scene, serverData) {
    scene.traverse(obj => {
      if (obj.isMesh) {
        if (!obj.geometry.boundingBox) {
          obj.geometry.computeBoundingBox();
        }
        const box = obj.geometry.boundingBox.clone();
        box.applyMatrix4(obj.matrixWorld);
        obj.visible = serverData.boxWithin(box);
      }
    });
  }

  release() {
    this._shouldConnect = false;
    if (this._current) {
      this._current.disconnect();
      this._current = null;
    }
  }

  acquire() {
    this._shouldConnect = true;
    this.updatePosition();
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
