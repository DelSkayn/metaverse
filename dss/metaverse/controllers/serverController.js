var Server = require('../models/servers');

var async = require('async');

exports.index = function(req, res) {   
    
    async.parallel({
        locations_count: function(callback) {
            Server.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        }
    }, function(err, results) {
        res.render('index', { title: 'Domain Space Server Home', error: err, data: results });
    });
};

// Display list of all Servers.
exports.server_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Server list');
};

// Display detail page for a specific Server.
exports.server_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: Server detail: ' + req.params.id);
};

// Display Server create form on GET.
exports.server_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Server create GET');
};

// Handle Server create on POST.
exports.server_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Server create POST');
};

// Display Server delete form on GET.
exports.server_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Server delete GET');
};

// Handle Server delete on POST.
exports.server_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Server delete POST');
};

exports.server_delete = function(req, res) {
    res.send('NOT IMPLEMENTED: Server delete POST');
}; 

// Display Server update form on GET.
exports.server_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Server update GET');
};

// Handle Server update on POST.
exports.server_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Server update POST');
};