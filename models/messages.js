var mongoose = require("mongoose");

var schema = mongoose.Schema({ // define schema
    timestamp: String,
    user: String,
    message: String,
});

module.exports = mongoose.model('Message', schema); 