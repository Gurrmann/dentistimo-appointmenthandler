var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://test.mosquitto.org')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var db = mongoose.connection;
var Appointment = require('./models/appointment');


client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {
  var timeSlot = JSON.parse(message)
  checkBooking(timeSlot)


})

var checkBooking = (booking) => {

  Appointment.find({ dentistry: booking.dentistid, timeSlot: booking.time },function(err, result) {
    if (err)
    var bookingExist

    if (result.length === 0) {
      bookingExist = false
      saveAppointment(booking)
      notifyUser(bookingExist, booking.userid)
    }
    else {
      bookingExist = true
      notifyUser(bookingExist, booking.userid)
    }
  })
}


var saveAppointment = (data) => {
  var appointmentData = {
    dentistry: data.dentistid,
    timeSlot: data.time,
    userId: data.userid,
  }
  var appointment = new Appointment(appointmentData)
  appointment.save(function(err, result){
    if(err){
      console.log(err)
    }
  })
}

var notifyUser = (bookingExist, userid) => {

  let bookingSuccess = '{"msg": "Your selected time has been booked!"}'
  let bookingFailed = '{"msg": "This timeslot is already booked please try a new one!"}'

  client.publish(`${userid}`, bookingExist ? bookingFailed : bookingSuccess)
}
