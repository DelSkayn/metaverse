var express = require("express");
var Servers = require("../models/servers");
var router = express.Router();

// DELETE some server.
router.delete("/", function(req, res) {
  deleteServer(req, res);
});

function deleteServer(req, res) {
  console.dir(req.query.serverid);
  data = req.query.serverid;
  if (req.query.serverid === undefined) {
    res.json({
      result: "error",
      error: "missing serverid"
    });
    return;
  }
  Servers.deleteMany({ serverID: data }, function(err) {
    if (err) {
      res.status(500);
      res.render("error", { error: err });
      return;
    }
  }).lean();
  res.json({
    result: "ok"
  });
}

router.post("/", function(req, res) {
  launchServer(req, res);
});

function launchServer(req, res) {
  console.log(req);
  reqData = req.body;
  if (reqData.locations === undefined || reqData.serverid === undefined) {
    res.json({
      result: "error",
      error: "missing server properties"
    });
    return;
  }
  try {
    reqData.locations.forEach(location => {
      Servers.count({ location }, function(err, count) {
        if (err) {
          throw err;
        }
        if (count == 0) {
          let location_server_detail = {
            location: location,
            serverID: reqData.serverid
          };
          let loc = new Servers(location_server_detail);
          loc.save(function(err) {
            if (err) {
              throw err;
            }
          });
        }
      });
    });
  } catch (e) {
    res.status(500);
    res.render("error", { error: e });
    return;
  }
  res.json({
    result: "ok"
  });
}

router.put("/", function(req, res) {
  console.dir(req.query.serverid);
  if (req.body.serverid === undefined) {
    res.json({
      result: "error",
      error: "missing serverid"
    });
    return;
  }
  Servers.deleteMany({ serverID: req.body.serverid }, function(err) {
    if (err) {
      res.status(500);
      res.render("error", { error: err });
      return;
    }
  }).lean();
  launchServer(req, res);
});

// req.query.x = , .y = , .z =
router.get("/", function(req, res) {
  if (
    req.query.x === undefined ||
    req.query.y === undefined ||
    req.query.z === undefined
  ) {
    res.json({
      result: "error",
      error: "missing query position"
    });
    return;
  }
  var x = req.query.x;
  console.dir(req.query.x);
  var y = req.query.y;
  console.dir(req.query.y);
  var z = req.query.z;
  console.dir(req.query.z);
  var top = 3;
  //var distances = [];
  // iterate over all locations
  Servers.find({}, (err, oriservers) => {
    if (err) {
      res.status(500);
      res.render("error", { error: err });
      return;
    }

    let servers = oriservers.map(server => {
      // extract location
      // get total distance between current server location and current location
      var distance = Math.abs(
        x -
          server.location[0] +
          (y - server.location[1]) +
          (z - server.location[2])
      );
      return { distance, ID: server.serverID };
    });

    servers.sort(function(a, b) {
      var keyA = a.distance,
        keyB = b.distance;
      // Compare the 2 dates
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });

    console.log(servers);
    var topServers = [];
    let serverSet = new Set();
    for (let i = 0; i < servers.length; i++) {
      if (serverSet.has(servers[i].ID)) continue;
      topServers.push(servers[i]);
      console.log(topServers);
      serverSet.add(servers[i].ID);
      console.log(serverSet);
      if (topServers.length >= top + 1) break;
    }
    let lastDist = null;
    if (topServers.length == top + 1) {
      lastDist = topServers.pop().distance;
    }

    topServers = topServers.map(server => {
      return { locations: [], ID: server.ID, distance: server.distance };
    });

    oriservers.forEach(server => {
      topServers.forEach(topserver => {
        if (topserver.ID == server.serverID)
          topserver.locations.push(server.location);
      });
    });

    res.json({
      result: "ok",
      servers: topServers,
      nextDist: lastDist
    });
  });
});

module.exports = router;
