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
    this.nameCanvas = document.createElement("canvas");

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
      conn.on("close", () => {
        console.log("DISCONNECTED!!!!!!!!!");
        this.root.remove(connData.object);
        _.remove(this.connections, x => x == connData);
      });
    });
  }

  createNameSprite(name) {
    const ctx = this.nameCanvas.getContext("2d");
    ctx.font = "100px Arial";
    const metrics = ctx.measureText(name);
    ctx.canvas.width = metrics.width;
    ctx.canvas.height = 100;
    ctx.clearRect(0, 0, this.nameCanvas.width, this.nameCanvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "100px Arial";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.fillText(name, 0, 80);
    ctx.strokeText(name, 0, 80);
    const text = new THREE.CanvasTexture(this.nameCanvas);
    console.log(text.transformUv(new THREE.Vector2(0.5, 0.5)));
    const geom = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.SpriteMaterial({ map: text, color: 0xffffff });
    //const mat = new THREE.MeshBasicMaterial({ map: text, color: 0xffffff });

    let scale = new THREE.Vector2(metrics.width, 100);
    scale.normalize();
    const res = new THREE.Sprite(mat);
    //const res = new THREE.Mesh(geom, mat);
    res.scale.set(scale.x, scale.y, 1);
    res.position.setY(1.2);
    return res;
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
      connData.object.add(this.createNameSprite(connData.userName));
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
    conn.on("close", () => {
      console.log("DISCONNECTED!!!!!!!!!");
      this.root.remove(connData.object);
      _.remove(this.connections, x => x == connData);
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
