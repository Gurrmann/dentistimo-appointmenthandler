var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var appointmentSchema = new Schema ({
    type : {type: String, required: true},
    id : {type: Number, required: true, unique: true},
    time_slot : {type: Schema.Types.ObjectId, ref: 'Time_slot', required: true},
    dentistry : {type: Schema.Types.ObjectId, ref: 'Dentistry', required: true}
});

module.exports = mongoose.model('appointments', appointmentSchema);
