const { Rpc } = require("metaverse-common");
const { Module } = require("./mod");

class RpcConnection {
  constructor(addr) {
    this.ws = new WebSocket("ws://" + addr);
    this.waitOnConnection = true;

    this.ws.onopen = () => {
      this.isConnected = true;
      if (this.onopen) {
        this.onopen();
      }
    };

    this.ws.onerror = e => {
      if (this.onopen) {
        this.onerror(e);
      }
    };

    this.ws.onmessage = m => {
      if (this.onmessage) {
        this.onmessage(m.data);
      }
    };

    this.ws.onclose = () => {
      if (this.onclose) {
        this.onclose();
      }
    };
  }

  send(x) {
    this.ws.send(x);
  }
}

class ClientConnection {
  constructor(server) {
    this.addr = server.addr;
    this.chunks = server.chunks;
    this.connection = null;
    this.rpc = null;
    this.module = new Module();
    delete this.module.context.parent;
    this.module.context.url = server.addr;
  }

  async connect() {
    console.log("connecting to ", this.addr);
    let req = await fetch("http://" + this.addr).catch(console.error);
    console.log(req);
    let text = await req.text();
    console.log(text);
    this.connection = new RpcConnection(this.addr + "/meta/ws");
    console.log(Rpc);
    this.rpc = new Rpc(this.connection);
    this.module.context.remote = this.rpc.remote;
    this.module.addScript(text);
  }
}

module.exports = {
  ClientConnection
};
