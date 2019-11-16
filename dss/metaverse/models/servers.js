var mongoose = require('mongoose');
mongoose.set('debug', true);


var Schema = mongoose.Schema;

var ServerSchema = new Schema(
  {
  	location: {type: [Number], required: true},
    serverID: {type: String, required: true}
  }
);

// Virtual for URL
ServerSchema
.virtual('url')
.get(function () {
  return '/servers/' + this._id;
});

//Export model
module.exports = mongoose.model('Servers', ServerSchema);