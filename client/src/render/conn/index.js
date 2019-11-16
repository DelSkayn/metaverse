const { Rpc, EventEmitter } = require("metaverse-common");
const { Scene } = require("./scene");
const { Module } = require("./mod");
const THREE = require("three");
const GLTFLoader = require("three-gltf-loader");

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
      this.emit("message", m.data);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
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

// Manages a connection to a server
class ServerConnection {
  constructor(server) {
    this.server = server;
    this.connection = null;
    this.rpc = null;

    this.loaded = false;
    this.connected = false;
    this.shouldConnect = false;
    this.connectionPromise = null;

    this.module = new Module();
    this.module.context.url = this.server.addr;
    this._scene = new Scene();
    this.module.context.scene = this.scene;
  }

  // Load a source file from the server;
  async load() {
    if (this.loaded) {
      return;
    }
    console.log("loading server: ", this.server.addr);
    let req = await fetch("http://" + this.server.addr);
    let text = await req.text();
    this.module.context.scene.three = THREE;
    this.module.context.scene.three.GLTFLoader = GLTFLoader;
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
    console.log("connection to server: ", this.server.addr);
    await this._connect();
  }

  async _connect() {
    while (this.shouldConnect) {
      try {
        /// Create a rpc connection
        const connection = new RpcConnection(this.server.addr + "/meta/ws");
        const rpc = new Rpc(connection);

        /// Setup promises
        let d = Q.defer();

        connection.once("open", true).then(d.resolve);
        connection.once("error", true).then(d.reject);
        await d.promise;
        connection.once("close", true).then(this._close.bind(this));

        this.connection = connection;
        this.rpc = rpc;
        this.scene.emit("connect", this.rpc);
        this.connectionPromise = null;
        this.connected = true;
        return;
      } catch (e) {
        if (e instanceof ConnectionStopped) {
          return;
        }
        throw e;
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
    this.connected = false;
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
  ServerConnection
};
