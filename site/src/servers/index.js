const { getServers, ServerData } = require("./dss");
const { EventEmitter } = require("metaverse-common");
const { Thread, patch } = require("../thread");
const { toChunkPosition } = require("../camera");
const { Patch } = require("../thread");
const Q = require("q");
const _ = require("lodash");

class Server {
  constructor(data) {
    console.assert(data, "Server needs a server data");
    this._data = data;
    this._isLoaded = false;
    this._thread = null;
    this._context = null;
  }

  async load() {
    let request = await fetch("http://" + this._data.addr);
    let script = await request.text();
    this._thread = new Thread();
    this._thread.emit("init", {
      url: this._data.addr
    });
    this._thread.run(script);
    this._context = new Patch(this._thread);
    this._isLoaded = true;
  }

  // The patch object belonging to the server
  get context() {
    this._context;
  }

  // The channel belonging to the server;
  get channel() {
    return {
      emit: _.bind(this._thread.emit, this._thread),
      on: _.bind(this._thread.on, this._thread),
      once: _.bind(this._thread.once, this._thread)
    };
  }
}

// Class which manages servers
// # Events
// - Change: Emitted when the current server changes, current server passed to arguments can be null.
class Servers extends EventEmitter {
  constructor() {
    super();
    this._servers = [];
    this._current = null;
    this._currentPosition = null;
  }

  async load(pos) {
    console.assert(pos, "Servers.load requires a position!");
    this._currentPosition = toChunkPosition(pos);
    const data = await getServers(pos);

    let promises = data.map(
      (x => {
        const s = new Server(x);
        this._servers.push(s);
        let promise = s.load();
        if (x.isWithin(this._currentPosition)) {
          this._current = s;
          promise.then(() => {
            s.channel.emit("enter");
            this.emit("change", s);
          });
        }
        this._servers.push({
          server: s,
          data: x
        });
        return promise.catch(e => {
          console.error(
            "failed to load data for server: " + x.addr + "\n ERROR: " + e
          );
        });
      }).bind(this)
    );

    await Q.all(promises);
  }

  updatePos(pos) {
    const newPos = toChunkPosition(pos);
    if (newPos.equals(this.toChunkPosition)) {
      return;
    }

    //this._current.emit("leave");
    let newCurrent = null;
    this._servers.forEach(x => {
      if (x.data.isWithin(newPos)) {
        newCurrent = x.server;
      }
    });
    if (newCurrent != this._current) {
      this._current.emit("leave");
      this._current = newCurrent;
      if (this._current) {
        this._current.emit("enter");
      }
      this.emit("change", this._current);
    }
  }

  get current() {
    return this._current;
  }
}

module.exports = {
  Servers
};
