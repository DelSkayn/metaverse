const { Rpc, EventEmitter } = require("metaverse-common");
const { Scene } = require("./scene");
const { Module } = require("./mod");

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
      this.emit("message", m.data);
    };

    this.ws.onclose = () => {
      this.emit("close");
    };
  }

  send(x) {
    this.ws.send(x);
  }

  close() {
    this.ws.close();
  }
}

class ClientConnection {
  constructor(server) {
    this.addr = server.addr;
    this.chunks = server.chunks;
    this.connection = null;
    this.rpc = null;

    this.loaded = false;
    this.connected = false;
    this.shouldConnect = false;

    this.module = new Module();
    delete this.module.context.parent;
    this.module.context.url = server.addr;
    this._scene = new Scene();
    this.module.context.scene = this.scene;
  }

  // Load a source file from the server;
  async load() {
    if (this.loaded) {
      return;
    }
    console.log("loading server: ", this.addr);
    let req = await fetch("http://" + this.addr);
    let text = await req.text();
    this.module.addScript(text);
    this.loaded = true;
  }

  // TODO cancel reconnect when disconnect is called
  async connect() {
    this.shouldConnect = true;
    if (this.connected) {
      return;
    }
    await this.load();
    console.log("connection to server: ", this.addr);
    await this._connect();
  }

  async _connect() {
    while (this.shouldConnect) {
      try {
        const connection = new RpcConnection(this.addr + "/meta/ws");
        const rpc = new Rpc(connection);
        let d = Q.defer();

        connection.once("open", true).then(d.resolve);
        connection.once("error", true).then(d.reject);
        await d.promise;
        connection.once("close", true).then(this._close.bind(this));

        this.connection = connection;
        this.rpc = rpc;
        this.scene.emit("connect", this.rpc);
        return;
      } catch (e) {
        console.warn("error while trying to connect: ", e);
        await wait(4000);
      }
    }
  }

  get scene() {
    return this._scene;
  }

  _close() {
    this.connection = null;
    this.rpc = null;
    this.isConnected = false;
    this.scene.emit("disconnect");

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
  ClientConnection
};
