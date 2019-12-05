const Q = require("q");
const { Vector3 } = require("three");

async function getServers(pos) {
  let url = "http://metaworld.duckdns.org:3000/api?";
  url += "x=" + pos.x;
  url += "&y=" + pos.y;
  url += "&z=" + pos.z;

  let res;
  let data;
  try {
    res = await fetch(url);
    data = await res.json();
  } catch (err) {
    console.error("Error loading dss");
    console.error(err);
    throw err;
  }

  if (data.result === "error") {
    return [];
  }

  let result = [];
  data.servers.forEach(x => {
    result.push(
      new ServerData(x.ID, x.locations.map(x => new Vector3(x[0], x[1], x[2])))
    );
  });

  console.log(result);

  return result;
}

class ServerData {
  constructor(addr, chunks) {
    this.addr = addr;
    this.chunks = chunks;
    this.chunkNeighbours = this.chunks.map(a => {
      let neighbours = {
        up: false,
        down: false,
        right: false,
        left: false,
        forward: false,
        backward: false
      };
      chunks.forEach(b => {
        if (a.x == b.x + 1) {
          neighbours.right = true;
        }
        if (a.x == b.x - 1) {
          neighbours.left = true;
        }
        if (a.y == b.y + 1) {
          neighbours.up = true;
        }
        if (a.y == b.y - 1) {
          neighbours.down = true;
        }
        if (a.z == b.z + 1) {
          neighbours.forward = true;
        }
        if (a.z == b.z - 1) {
          neighbours.backward = true;
        }
      });
      return neighbours;
    });
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

  boxWithin(box) {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const neighbour = this.chunkNeighbours[i];

      if (!neighbour.top) {
        if (box.max.y > chunk.y + 10) {
          return false;
        }
      }

      if (!neighbour.bottom) {
        if (box.min.y < chunk.y) {
          return false;
        }
      }

      if (!neighbour.right) {
        if (box.max.x > chunk.x + 10) {
          return false;
        }
      }

      if (!neighbour.left) {
        if (box.min.x < chunk.x) {
          return false;
        }
      }

      if (!neighbour.forward) {
        if (box.max.z > chunk.z + 10) {
          return false;
        }
      }

      if (!neighbour.backward) {
        if (box.min.z < chunk.z) {
          return false;
        }
      }
    }
  }
}

module.exports = {
  getServers,
  ServerData
};
