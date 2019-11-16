const { Vector3 } = require("three");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");

class Servers {
  constructor() {
    this._currentChunk = new Vector3();
    this._connections = [];
    this._current = null;
  }

  async load(pos) {
    const servers = await getServers(pos);

    servers.forEach(x => {
      this._connections.push(new ServerConnection(x));
    });

    // Load initial script
    this._connections.forEach(x => {
      x.load().then(() => {
        // If this server is the one the client is in
        // connect to the server;
        if (x.server.isWithin(transform.position)) {
          this._current = this._connections[i];
          this._current = this._connections.connect();
        }
      });
      /*
        .catch(x => {
          console.error("Failed to fetch index from server: " + x);
        });
        */
    });
  }

  _updateCurrent() {}

  updatePosition(position) {
    const pos = position.clone();
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
        this._current.connect();
      }
    });
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
