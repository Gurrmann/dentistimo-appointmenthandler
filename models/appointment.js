var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var appointmentSchema = new Schema ({

    userId : {type: Number, required: true},
    timeSlot : {type: String, required: true},
    dentistry : {type: Number, required: true},
    dateInMilliseconds : {type: Number, required: true}
});

module.exports = mongoose.model('appointments', appointmentSchema);
