const { Server, Rpc, Connection } = require("metaverse-server");

const args = {
  port: "8000",
  addr: "localhost",
  files: {
    path: "static",
    index: "index.js"
  }
};

let counter = 0;

expo = {
  log(text) {
    console.log(text);
    counter += 1;
    console.log("count: " + counter);
  }
};

const server = new Server(args);
server.start().catch(console.error);
server.on("connection", connection => {
  console.log("recieved connection");
  let rpc = new Rpc(connection, expo);
});
