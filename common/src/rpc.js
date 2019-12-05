const Q = require("q");
const { EventEmitter } = require("./event");
// Utilities dealing with server connection

// Types of messages that can be send
const MSG_TY = Object.freeze({
  CALL: 0,
  RESULT: 1,
  ERROR: 2
});

// Types of possible errors
const RPC_ERROR = Object.freeze({
  CONNECTION_LOST: 0,
  NO_SUCH_FUNCTION: 1,
  REMOTE_ERROR: 2
});

class RpcRemoteError extends Error {
  constructor(remoteErr) {
    super("remote error: " + remoteErr);
  }
}

class RpcReferenceError extends Error {
  constructor() {
    super("no such function on remote");
  }
}

class RpcConnectionError extends Error {
  constructor() {
    super("connection lost to remote");
  }
}

class Rpc extends EventEmitter {
  constructor(connection) {
    super();
    this.connection = connection;
    /// The number for the next call
    this.count = 0;
    /// Pending function calls.
    this.pending = {};

    /// Setup connection callbacks
    if (!this.connection.isConnected) {
      const d = Q.defer();
      this.openPromise = d.promise;

      this.connection.on("open", d.resolve);
      this.connection.on("error", d.reject);
    }

    this.connection.on("close", () => {
      // Connection lost so reject all pending functions
      for (let v in this.pending) {
        this.pending[v].reject(new RpcConnectionError());
        delete this.pending[v];
      }
      this.emit("close");
    });

    this.connection.on("message", msg => {
      try {
        this._handleMessage(JSON.parse(msg));
      } catch (e) {
        if (e instanceof SyntaxError || e instanceof ReferenceError) {
          console.warn("recieved invalid message: ", e);
        } else {
          throw e;
        }
      }
    });

    // Syntatic sugar for remote calls
    this.remote = new Proxy(this, {
      get: (target, name) => {
        return async function() {
          const args = Array.prototype.slice.call(arguments);
          return await target.call(name, args);
        };
      }
    });
  }

  /// Call a function on remote with a given name and arguments
  async call(name, args) {
    await this._assertConnection();

    const curCount = this.count++;

    const d = Q.defer();
    this.pending[curCount] = d;

    this.connection.send(
      JSON.stringify({
        ty: MSG_TY.CALL,
        name: name,
        args: args,
        count: curCount
      })
    );
    return await d.promise;
  }

  async _handleMessage(msg) {
    switch (msg.ty) {
      case MSG_TY.CALL:
        {
          if (this.expo[msg.name]) {
            try {
              const func = this.expo[msg.name];
              const res = func(...msg.args);
              this._sendRes(res, msg.count);
            } catch (e) {
              this._sendError(RPC_ERROR.REMOTE_ERROR, msg.count, e.toString());
            }
          } else {
            this._sendError(RPC_ERROR.NO_SUCH_FUNCTION, msg.count);
          }
        }
        break;

      case MSG_TY.RESULT:
        {
          if (this.pending[msg.count]) {
            this.pending[msg.count].resolve(msg.res);
            delete this.pending[msg.count];
          } else {
            console.warn("recieved result for non pending call");
          }
        }
        break;

      case MSG_TY.ERROR:
        {
          if (this.pending[msg.count]) {
            switch (msg.err) {
              case RPC_ERROR.NO_SUCH_FUNCTION:
                this.pending[msg.count].reject(new RpcReferenceError());
                break;
              case RPC_ERROR.RPC_ERROR:
                this.pending[msg.count].reject(
                  new RpcReferenceError(msg.addError)
                );
                break;
              default:
                console.warn("recieved invalid error message from remote");
                this.pending[msg.count].reject(new Error("invalid error"));
            }
            delete this.pending[msg.count];
          } else {
            console.warn("recieved error for non pending call");
          }
        }
        break;

      default:
        console.warn("recieved invalid message: ", msg);
    }
  }

  async _assertConnection() {
    if (this.openPromise) {
      await this.openPromise;
    }
    if (!this.connection.isConnected) {
      throw new RpcConnectionError();
    }
  }

  async _sendRes(res, count) {
    await this._assertConnection().catch(x => {
      console.warn("connection lost while trying to send response!");
    });
    this.connection.send(
      JSON.stringify({
        ty: MSG_TY.RESULT,
        res: res,
        count: count
      })
    );
  }

  async _sendError(err, count, addError) {
    await this._assertConnection().catch(x => {
      console.warn("connection lost while trying to send error!");
    });
    this.connection.send(
      JSON.stringify({
        ty: MSG_TY.ERROR,
        err: err,
        count: count,
        addError: addError
      })
    );
  }
}

module.exports = { Rpc, RpcReferenceError, RpcConnectionError, RpcRemoteError };
