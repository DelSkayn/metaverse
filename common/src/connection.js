const Q = require("q");
// Utilities dealing with server connection

const MSG_TY = Object.freeze({
  CALL: 0,
  RESULT: 1,
  ERROR: 2
});

const RPC_ERROR = Object.freeze({
  CONNECTION_LOST: 0,
  NO_SUCH_FUNCTION: 1,
  REMOTE_ERROR: 2
});

class RpcCallError {
  constructor(err, addError) {
    this.err = err;
    this.addError = addError;
  }

  toString() {
    switch (this.err) {
      case RPC_ERROR.CONNECTION_LOST:
        return "connection lost during call";
      case RPC_ERROR.NO_SUCH_FUNCTION:
        return "no such function defined on remote";
      case RPC_ERROR.REMOTE_ERROR:
        return "error on server side: " + this.addError.toString();
      default:
        return "unknown error";
    }
  }
}

class Rpc {
  constructor(connection, expo) {
    this.connection = connection;
    this.expo = expo;

    /// The number for the next call
    this.count = 0;
    /// Pending function calls.
    this.pending = {};

    /// Setup connection callbacks
    if (!this.connection.isConnected) {
      const d = Q.defer();
      this.openPromise = d.promise;

      this.connection.onopen = () => {
        d.resolve();
      };

      this.connection.onerror = e => {
        d.reject(e);
      };
    }

    this.connection.onclose = () => {
      // Connection lost so reject all pending functions
      for (let v in this.pending) {
        this.pending[v].reject(new RpcCallError(RPC_ERROR.CONNECTION_LOST));
        delete this.pending[v];
      }
    };

    this.connection.onmessage = msg => {
      console.log("rpc recv message");
      try {
        this._handleMessage(JSON.parse(msg));
      } catch (e) {
        if (e instanceof SyntaxError || e instanceof ReferenceError) {
          console.warn("recieved invalid message: ", e);
        }
        throw e;
      }
    };

    // Syntatic sugar for remote calls
    this.remote = new Proxy(this, {
      get: (target, name) => {
        return async function() {
          const args = Array.prototype.slice.call(arguments);
          console.log(args);
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
        args: args
      })
    );
    await d.promise;
  }

  async _handleMessage(msg) {
    switch (msg.ty) {
      case MSG_TY.CALL:
        {
          if (this.expo[msg.name]) {
            try {
              const res = this.expo[msg.name](...msg.args);
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
            this.pending[msg.count].resolve(msg.result);
            delete this.pending[msg.count];
          } else {
            console.warn("recieved result for non pending call");
          }
        }
        break;

      case MSG_TY.ERROR:
        {
          if (this.pending[msg.count]) {
            this.pending[msg.count].reject(
              new RpcCallError(msg.err, msg.addError)
            );
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
  }

  async _sendRes(res, count) {
    console.log("rpc: sending res");
    await this._assertConnection();
    this.connection.send(
      JSON.stringify({
        ty: MSG_TY.RESULT,
        res: res,
        count: count
      })
    );
  }

  async _sendError(err, count, addError) {
    await this._assertConnection();
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

module.exports = { Rpc, RpcCallError };
