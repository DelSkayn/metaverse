var express = require('express');
var router = express.Router();

var server_controller = require('../controllers/serverController');
//console.log(server_controller);


/// Server ROUTES ///

// GET catalog home page.
router.get('/', server_controller.index); //This actually maps to /servers/ because we import the route with a /server prefix

// overal moet de req een /:id zijn 


// GET request for creating Server. NOTE This must come before route for id (i.e. display Server).
router.get('/create', server_controller.server_create_get);

// POST request for creating Server.
router.post('/create', server_controller.server_create_post);

// GET request to delete Server.
router.get('/:id/delete', server_controller.server_delete_get);

// POST request to delete Server.
//router.post('/:id/delete', server_controller.server_delete_post);
router.delete('/:id', server_controller.server_delete);


// GET request to update Server.
router.get('/:id/update', server_controller.server_update_get);

// POST request to update Server.
router.post('/:id/update', server_controller.server_update_post);

// GET request for top 3 Servers. /1.1.1
// res is res.json() dus de servers die erom zitten 
// req.body om de meegestuurde data (ip adress and port) 
router.get('/:id', server_controller.server_detail);

// GET request for list of all Servers.
router.get('/', function(req,res){
	server_controller.server_list(req,res);
});


module.exports = router;