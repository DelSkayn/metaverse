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

module.exports = {
  getServers,
  ServerData
};
