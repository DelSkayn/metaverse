const polka = require("polka");
const assert = require("assert");
const WebSocket = require("ws");
const url = require("url");
const serveStatic = require("serve-static");
const { Rpc } = require("metaverse-common");
const defaultsDeep = require("@nodeutils/defaults-deep");
const EventEmitter = require("events");
const Q = require("q");

/// Wrapper around websocket implementations to allow using the same rpc implementation.
class Connection {
  constructor(ws) {
    this.conn = ws;
    this.waitOnConnection = true;

    this.conn.on("message", msg => {
      console.log("recv message");
      if (this.onmessage && typeof this.onmessage === "function") {
        this.onmessage(msg);
      }
    });

    this.conn.on("close", msg => {
      if (this.onclose && typeof this.onclose === "function") {
        this.onclose(msg);
      }
    });
  }
}

class Server extends EventEmitter {
  constructor(args, expo) {
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
      this.wss.on("connection", con => {
        this.emit("connection", new Connection(con));
      });
    }

    const serve = serveStatic(opts.files.path, {
      index: opts.files.index
    });

    this.server = polka();
    this.server.use(serve);
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
      this.server.server.on(
        "upgrade",
        function upgrade(request, socket, head) {
          const pathname = url.parse(request.url).pathname;
          console.log(pathname);

          if (pathname === this.opts.connection.urlPath) {
            this.wss.handleUpgrade(
              request,
              socket,
              head,
              function done(ws) {
                this.wss.emit("connection", ws, request);
              }.bind(this)
            );
          } else {
            socket.destroy();
          }
        }.bind(this)
      );
    }
    await d.promise;
  }
}

module.exports = {
  Server,
  Connection,
  Rpc
};
