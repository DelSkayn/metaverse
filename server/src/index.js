const polka = require("polka");
const assert = require("assert");
const WebSocket = require("ws");
const url = require("url");
const cors = require("cors")();
const serveStatic = require("serve-static");
const { Rpc, EventEmitter } = require("metaverse-common");
const defaultsDeep = require("@nodeutils/defaults-deep");
const Q = require("q");

/// Wrapper around websocket implementations to allow rpc to use it.
class Connection extends EventEmitter {
  constructor(ws, wss) {
    super();
    this.conn = ws;
    this.server = wss;
    this.isConnected = true;
    this.conn.on("message", msg => {
      if (msg.slice(0, 4) == "rpc:") {
        this.emit("message", msg.slice(4));
      } else {
        this.server.clients.forEach(x => {
          if (x.readyState === ws.OPEN && x !== this.conn) {
            x.send(msg);
          }
        });
      }
    });
    this.conn.on("close", () => {
      this.emit("close");
    });
  }

  send(x) {
    this.conn.send("rpc:" + x);
  }
}

class Server extends EventEmitter {
  constructor(args) {
    const defaults = {
      reload: false,
      port: "8080",
      addr: "localhost",
      files: {
        path: "static",
        index: "index.js"
      },
      connection: {
        enabled: true,
        urlPath: "/meta/ws"
      }
    };
    let opts = defaultsDeep(args, defaults);
    super();
    this.opts = opts;

    //assert.strictEqual(typeof opt.index, "function");

    if (opts.connection.enabled) {
      console.log("starting websocket server");
      this.wss = new WebSocket.Server({ noServer: true });
      this.wss.on(
        "connection",
        (con => {
          this.emit("connection", new Connection(con, this.wss));
        }).bind(this)
      );
    }

    const serve = serveStatic(opts.files.path, {
      index: opts.files.index
    });

    this.server = polka();
    this.server.use(cors, serve);
  }

  async start() {
    let d = Q.defer();
    console.log(
      "starting meta-server on " + this.opts.addr + ":" + this.opts.port
    );
    this.server.listen(this.opts.port, e => {
      if (e) {
        d.reject(e);
      } else {
        d.resolve();
      }
    });
    if (this.opts.connection.enabled) {
      this.server.server.on("upgrade", this.upgrade.bind(this));
    }
    await d.promise;
  }

  upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
    console.log("upgrade request from ", pathname);

    if (pathname === this.opts.connection.urlPath) {
      this.wss.handleUpgrade(
        request,
        socket,
        head,
        (ws => {
          this.wss.emit("connection", ws, request);
        }).bind(this)
      );
    } else {
      socket.destroy();
    }
  }
}

module.exports = {
  Server,
  Connection,
  Rpc
};
