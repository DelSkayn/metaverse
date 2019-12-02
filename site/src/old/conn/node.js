const { EventEmitter } = require("metaverse-common");
const { peerjs } = require("peerjs");
const { Vector3 } = require("three");

class Node extends EventEmitter {
  constructor() {
    super();
    this.position = new Vector3();
    this.peer = new peerjs.Peer();
    this.knownClients = new Set();
    this.connections = [];
    this.peer.on("connection", conn => {
      console.log(conn);
      this.knownClients.add(conn.peer);
      const connData = {
        conn,
        position: new Vector3()
      };
      this.connections.push(connData);
      conn.on("data", data => {
        console.log(data);
        let newPosition = JSON.parse(data);
        connData.position = new Vector3(
          newPosition.x,
          newPosition.y,
          newPosition.z
        );
      });
    });
  }

  addConnection(id) {
    if (this.knownClients.has(id)) {
      return;
    }
    this.knownClients.add(id);
    const conn = this.peer.connect(id);
    const connData = {
      conn,
      position: new Vector3()
    };
    this.connections.push(connData);
    conn.on("data", data => {
      console.log(data);
      let newPosition = JSON.parse(data);
      connData.position = new Vector3(
        newPosition.x,
        newPosition.y,
        newPosition.z
      );
    });
    console.log(conn);
  }

  tick(position) {
    if (!this.position) {
      this.position.copy(position);
    }
    if (!position.equals(this.position)) {
      this.position.copy(position);
      this.connections.forEach(x => {
        x.conn.send(JSON.stringify(this.position));
      });
    }
  }
}

module.exports = {
  Node
};
