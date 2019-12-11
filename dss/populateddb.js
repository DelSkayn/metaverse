#! /usr/bin/env node

console.log("This script populates some servers");

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require("async");
var Location = require("./models/servers");

var mongoose = require("mongoose");
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var locations = [];

function serverCreate(location, serverID, cb) {
  location_server_detail = { location: location, serverID: serverID };

  var location = new Location(location_server_detail);

  location.save(function(err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New location: " + location);
    locations.push(location);
    cb(null, location);
  });
}

function createServers(cb) {
  async.series(
    [
      function(callback) {
        serverCreate([0, 0, 0], "localhost:8000", callback);
      }
    ],
    // optional callback
    cb
  );
}

async.series(
  [createServers],
  // Optional callback
  function(err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("Locations: " + locations);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
