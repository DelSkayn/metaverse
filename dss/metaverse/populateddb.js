#! /usr/bin/env node

console.log('This script populates some servers');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async')
var Location = require('./models/servers')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var locations = []


function serverCreate(location, serverID, cb) {
  location_server_detail = {location:location , serverID: serverID }

  var location = new Location(location_server_detail);
       
  location.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New location: ' + location);
    locations.push(location)
    cb(null, location)
  }  );
}


function createServers(cb) {
    async.series([
        function(callback) {
          serverCreate([1,1,1], '123', callback);
        },
        function(callback) {
          serverCreate([1,1,2], '123', callback);
        },
        function(callback) {
          serverCreate([1,1,3], '123', callback);
        },
        function(callback) {
          serverCreate([3,4,7], '111', callback);
        },
        function(callback) {
          serverCreate([8,4,7], '878', callback);
        },
        function(callback) {
          serverCreate([10,4,2], '142', callback);
        },
        function(callback) {
          serverCreate([1,4,2], '242', callback);
        },
        function(callback) {
          serverCreate([2,5,6], '256', callback);
        },
        ],
        // optional callback
        cb);
}

async.series([
    createServers
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('Locations: '+locations);
        
    }
    // All done, disconnect from database
    mongoose.connection.close();
});