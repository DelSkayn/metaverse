const Q = require("q");
const { Vector3, Box3 } = require("three");
const config = require("../../config.json");

async function getServers(pos) {
  const dssAdress = config.dssAdress;

  let url = "http://" + dssAdress + "/api?";
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
      new ServerData(
        x.ID,
        x.locations.map(x => new Vector3(x[0], x[1], x[2])),
        x.distance
      )
    );
  });

  console.log(data);

  return {
    distance: data.nextDist,
    result
  };
}

class ServerData {
  constructor(addr, chunks, distance) {
    this.distance = distance;
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
        if (a.x + 1 == b.x) {
          neighbours.right = true;
        }
        if (a.x - 1 == b.x) {
          neighbours.left = true;
        }
        if (a.y + 1 == b.y) {
          neighbours.up = true;
        }
        if (a.y - 1 == b.y) {
          neighbours.down = true;
        }
        if (a.z - 1 == b.z) {
          neighbours.forward = true;
        }
        if (a.z + 1 == b.z) {
          neighbours.backward = true;
        }
      });
      return neighbours;
    });
  }

  copy(other) {
    this.chunks = other.chunks;
    this.neighbours;
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
    let intersects = false;
    if (window.printBox) {
      console.log(this);
    }
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const neighbour = this.chunkNeighbours[i];

      const min = chunk.clone();
      min.multiplyScalar(10);
      const max = min.clone();
      max.addScalar(10);
      const bb = new Box3(min, max);
      if (bb.containsBox(box)) {
        if (window.printBox) {
          console.log("contained");
        }
        return true;
      }
      if (!bb.intersectsBox(box)) {
        if (window.printBox) {
          console.log("no intersection");
        }
        continue;
      }
      intersects = true;

      if (!neighbour.up) {
        if (box.max.y > bb.max.y) {
          if (window.printBox) {
            console.log("max y");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }

      if (!neighbour.down) {
        if (box.min.y < bb.min.y) {
          if (window.printBox) {
            console.log("min y");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }

      if (!neighbour.right) {
        if (box.max.x > bb.max.x) {
          if (window.printBox) {
            console.log("max x");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }

      if (!neighbour.left) {
        if (box.min.x < bb.min.x) {
          if (window.printBox) {
            console.log("min x");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }

      if (!neighbour.forward) {
        if (box.min.z < bb.min.z) {
          if (window.printBox) {
            console.log("max z");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }

      if (!neighbour.backward) {
        if (box.max.z > bb.max.z) {
          if (window.printBox) {
            console.log("min z");
            console.log(box);
            console.log(bb);
          }
          return false;
        }
      }
    }
    return intersects;
  }
}

module.exports = {
  getServers,
  ServerData
};
