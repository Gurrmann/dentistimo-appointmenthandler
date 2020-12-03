var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://test.mosquitto.org')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var Appointment = require('./models/appointment')

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
      notifyUser(bookingExist, booking)
    }
    else {
      bookingExist = true
      notifyUser(bookingExist, booking)
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

var notifyUser = (bookingExist, booking) => {
  var time = booking.time.split(' ')[1]
  let bookingSuccess = `{"msg": "Your appointment was successfully booked"}`
  let bookingFailed = `{"msg": "This time slot is already booked"}`
  
  client.publish(`${booking.userid}`, bookingExist ? bookingFailed : bookingSuccess)
}
