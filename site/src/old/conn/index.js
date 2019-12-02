const { Rpc, EventEmitter } = require("metaverse-common");
const { Scene } = require("./scene");
const { Module } = require("./mod");
const THREE = require("three");

class ConnectionStopped extends Error {
  constructor() {
    super("connection was no longer required");
  }
}

async function wait(ms) {
  let d = Q.defer();
  setTimeout(d.resolve, ms);
  await d.promise;
}
// Wrapper around basic websockets to allow rpc to use it.
class RpcConnection extends EventEmitter {
  constructor(addr) {
    super();
    this.ws = new WebSocket("ws://" + addr);
    this.isConnected = false;

    this.ws.onopen = () => {
      this.emit("open");
      this.isConnected = true;
    };

    this.ws.onerror = e => {
      this.emit("error", e);
    };

    this.ws.onmessage = m => {
      const type = m.data.slice(0, 4);
      if (type === "rpc:") {
        this.emit("message", m.data.slice(4));
      } else {
        this.emit("idMessage", m.data.slice(4));
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.emit("close");
    };
  }

  send(x) {
    this.ws.send("rpc:" + x);
  }

  sendId(x) {
    this.ws.send("con:" + x);
  }

  close() {
    this.ws.close();
  }
}

// Manages a connection to a server
class ServerConnection {
  constructor(server, userName) {
    this.server = server;
    this.connection = null;
    this.rpc = null;
    this.userName = userName;

    this.loaded = false;
    this.connected = false;
    this.shouldConnect = false;
    this.connectionPromise = null;

    this._module = new Module();
  }

  // Load a source file from the server;
  async load() {
    if (this.loaded) {
      return;
    }
    console.log(this);
    console.log("loading server: ", this.server.addr);
    let req = await fetch("http://" + this.server.addr);
    let text = await req.text();
    console.log("addScript");
    this._module.mutValue(
      "url",
      (x => {
        x = this.server.addr;
      }).bind(this)
    );
    this._module.addScript(text);
    console.log("done");
    this.loaded = true;
  }

  // TODO cancel reconnect when disconnect is called
  async connect() {
    this.shouldConnect = true;
    if (this.connected) {
      return;
    }
    await this.load();
    console.log("connection to server: ", this.server.addr);
    await this._connect();
  }

  async _connect() {
    this.connected = true;
    this._module.emit("connect");
  }

  sendId(id) {
    this.connection.sendId(id);
  }

  onId(x) {
    this.connection.on("idMessage", x);
  }

  async tick() {
    if (!this.loaded) {
      return;
    }
    await this.module.tick();
  }

  get module() {
    return this._module;
  }

  _close() {
    this.connection = null;
    this.rpc = null;
    this.connected = false;
    this.scene.disconnect();

    // try to reconnect
  }

  async disconnect() {
    this.shouldConnect = false;
    if (!this.connected) {
      return;
    }
    // This should fire the `close` event thus no need to set isConnected;
    this.connection.close();
  }
}

module.exports = {
  ServerConnection
};
