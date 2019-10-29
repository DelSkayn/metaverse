const {
  Rpc,
  RpcConnectionError,
  RpcRemoteError,
  RpcReferenceError
} = require("./rpc");

const { EventEmitter } = require("./event");

module.exports = {
  Rpc,
  RpcConnectionError,
  RpcReferenceError,
  RpcRemoteError,
  EventEmitter
};
