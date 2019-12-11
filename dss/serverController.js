var Server = require('../models/servers');

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

// Display Server update form on GET.
exports.server_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Server update GET');
};

// Handle Server update on POST.
exports.server_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Server update POST');
};