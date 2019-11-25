const Q = require("q");

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
