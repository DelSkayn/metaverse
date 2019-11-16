var express = require("express");
var Servers = require("../models/servers");
var router = express.Router();

// GET home page.
router.get("/", function(req, res) {
  Servers.find({ serverID: "123" }, function(err, x) {
    if (err) {
      res.status(500);
      res.render("error", { error: err });
      return;
    }
    x.forEach(x => {
      delete x._id;
      delete x.__v;
    });
    res.json(x);
  }).lean();
});

/*
var userModel = mongoose.model('users');
var articleModel = mongoose.model('articles');
userModel.find({}, function (err, db_users) {
  if(err) {error!!!}
  articleModel.find({}, function (err, db_articles) {
    if(err) {error!!!}
    res.render('profile/profile', {
       users: db_users,
       articles: db_articles
    });
  });
});

*/

/*
// DELETE some servers 
router.delete('/', function(req, res) {
	Servers.find({serverID: "111"}, function(x){
		console.log(x);
		res.json(x)	
	});
	
 });

*/

module.exports = router;
