const { EventEmitter } = require("metaverse-common");
const { peerjs } = require("peerjs");
const { Vector3, Object3D } = require("three");
const THREE = require("three");
const _ = require("lodash");

class Node extends EventEmitter {
  constructor(userName) {
    super();
    this.userName = userName;
    this.position = new Vector3();
    this.peer = new peerjs.Peer();
    this.knownClients = new Set();
    this.connections = [];

    this.root = new THREE.Object3D();

    const geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.playerObject = new THREE.Mesh(geom, mat);
    this.playerObject.position.setY(-100);

    this.peer.on("connection", conn => {
      const object = this.playerObject.clone();
      this.root.add(object);
      this.knownClients.add(conn.peer);
      const connData = {
        conn,
        object,
        userName: null,
        position: null
      };
      this.connections.push(connData);
      conn.on("data", data =>
        this._handleConnectionData.bind(this)(data, connData)
      );
      conn.on("open", () => {
        conn.send({
          type: "username",
          userName: this.userName
        });
      });
    });
  }

  _handleConnectionData(data, connData) {
    console.log(data);
    if (data.type === "position") {
      connData.position = new Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      );
    }
    if (data.type === "username") {
      connData.userName = data.userName;
    }
  }

  addConnection(id) {
    if (this.knownClients.has(id)) {
      return;
    }
    this.knownClients.add(id);
    const conn = this.peer.connect(id);
    const object = this.playerObject.clone();
    this.root.add(object);
    const connData = {
      conn,
      object,
      userName: null,
      position: null
    };
    this.connections.push(connData);
    conn.on("data", data =>
      this._handleConnectionData.bind(this)(data, connData)
    );
    conn.on("open", () => {
      conn.send({
        type: "username",
        userName: this.userName
      });
    });
  }

  tick(position) {
    if (!this.position) {
      this.position.copy(position);
    }
    if (!position.equals(this.position)) {
      this.position.copy(position);
      this.connections.forEach(x => {
        x.conn.send({
          type: "position",
          position: {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z
          }
        });
      });
    }
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].position) {
        this.connections[i].object.position.copy(this.connections[i].position);
      }
    }
  }
}

module.exports = {
  Node
};
