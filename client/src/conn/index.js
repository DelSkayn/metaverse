const { Rpc, EventEmitter } = require("metaverse-common");
const { Scene } = require("./scene");
const { Module } = require("./mod");
const THREE = require("three");
const GLTFLoader = require("three-gltf-loader");
const Q = require("q");

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
  constructor(server, controlsContext, userName) {
    this.server = server;
    this.connection = null;
    this.rpc = null;
    this.userName = userName;
    this.controlsContext = controlsContext;

    this.loaded = false;
    this.connected = false;
    this.shouldConnect = false;
    this.connectionPromise = null;
  }

  // Load a source file from the server;
  async load() {
    if (this.loaded) {
      return;
    }
    console.log("loading server: ", this.server.addr);
    let req;
    let text;
    try {
      req = await fetch("http://" + this.server.addr);
      text = await req.text();
    } catch (e) {
      console.warn("error loading server: " + this.server.addr + " => " + e);
      throw e;
      return;
    }
    this._scene = new Scene(this.controlsContext);
    this.module = new Module(
      text,
      this.server.addr,
      this.userName,
      this._scene
    );
    this.module.context.scene = this.scene;
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
        this._scene.connect(this.rpc);
        this.connectionPromise = null;
        this.connected = true;
        return;
      } catch (e) {
        if (e instanceof ConnectionStopped) {
          return;
        }
        console.warn("error while trying to connect: ", e);
        await wait(4000);
      }
    }
  }

  sendId(id) {
    this.connection.sendId(id);
  }

  onId(x) {
    if (!this.connection) {
      return;
    }
    this.connection.on("idMessage", x);
  }

  get scene() {
    return this._scene;
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
