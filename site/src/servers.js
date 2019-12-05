const { Vector3 } = require("three");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const Q = require("q");

/// Manages connections to servers servers
class Servers {
  constructor(controlsContext, userName, node) {
    this.controlsContext = controlsContext;
    this._currentChunk = new Vector3();
    /// All known servers
    this._servers = {};
    /// The current connections
    this._connections = [];

    this._serversByDistance = [];

    this._lastLoadPosition = null;

    this._current = null;
    this._shouldConnect = null;
    this._username = userName;
    this._node = node;
    this.showAll = false;
  }

  async load(mainCamera) {
    this._lastLoadPosition = this.calcChunkPos(mainCamera.position);
    const servers = await getServers(this._lastLoadPosition);

    servers.forEach(x => {
      if (this._servers[x.addr]) {
        this._servers[x.addr].chunks = x.chunks;
        this._servers[x.addr].distance = x.distance;
      } else {
        this._serversByDistance.push(x);
        this._servers[x.addr] = x;
      }
    });

    this._serversByDistance.sort((a, b) => {
      if (a.distance < b.distance) {
        return 1;
      }
      if (a.distance > b.distance) {
        return -1;
      }
      return 0;
    });

    let promises = [];
    for (let i = 0; i < 4 && i < this._serversByDistance.length; i++) {
      const server = this._serversByDistance[i];
      console.log(server);
      if (server.connection) {
        continue;
      }
      let conn = new ServerConnection(
        server,
        this.controlsContext,
        this._username
      );
      const prom = conn
        .load()
        .then(async () => {
          server.connection = conn;
          // If this server is the one the client is in
          // connect to the server;
          if (server.isWithin(mainCamera.position)) {
            this._current = conn;
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
          console.warn("error loading server " + server.addr + " error: " + e);
        });
      promises.push(prom);
    }
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
    this._serversByDistance.forEach(x => {
      if (x.isWithin(this._currentChunk)) {
        if (!x.connection) {
          return;
        }
        this._current = x.connection;
        if (this._current.scene && this._current.scene.camera) {
          this._current.scene.camera.copy(mainCamera);
        }
        this._current.connect().then(
          (() => {
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
          if (window.printBox) {
            console.log(scene);
          }
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
    window.printBox = false;
  }

  _checkSceneValid(scene, serverData) {
    scene.traverse(obj => {
      if (obj.isMesh) {
        if (!obj.geometry.boundingBox) {
          obj.geometry.computeBoundingBox();
        }
        const box = obj.geometry.boundingBox.clone();
        box.applyMatrix4(obj.matrixWorld);
        if (window.printBox) {
          console.log(box);
        }
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
    return this._serversByDistance
      .filter(x => x.connection)
      .map(x => x.connection);
  }
}

module.exports = {
  Servers
};
