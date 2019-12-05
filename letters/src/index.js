const { Server, Rpc } = require("metaverse-server");

const args = {
  port: "8040",
  addr: "localhost",
  files: {
    path: "static",
    index: "index.js"
  }
};

let counter = 0;

expo = {
  log(x) {
    console.log(x);
  }
};

const server = new Server(args);
server.start().catch(console.error);
server.on("connection", connection => {
  console.log("recieved connection");
  let rpc = new Rpc(connection);
  rpc.expo = expo;
});
