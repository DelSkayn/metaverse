const Q = require("q");

async function getServers(pos) {
  pos.x;
  return [
    new ServerData("localhost:8000", [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 }
    ])
  ];
}

class ServerData {
  constructor(addr, chunks) {
    this.addr = addr;
    this.chunks = chunks;
  }

  isWithin(postion) {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      let within =
        postion.x >= chunk.x &&
        postion.x < chunk.x + 1 &&
        postion.y >= chunk.y &&
        postion.y < chunk.y + 1 &&
        postion.z >= chunk.z &&
        postion.z < chunk.z + 1;
      if (within) {
        return true;
      }
    }
    return false;
  }
}

module.exports = {
  getServers,
  ServerData
};
