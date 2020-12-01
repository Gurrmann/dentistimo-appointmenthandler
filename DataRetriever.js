var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var db = mongoose.connection;
var Appointment = require('./models/appointments')

client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {
  var timeSlot = JSON.parse(message)
  checkBooking(timeSlot)


})

var checkBooking = (timeSlot) => {

  var appointment = Appointment.find({ dentistry: timeSlot.dentistid, timeSlot: timeSlot.timeSlot }, )
  var bookingExist
  
  if (appointment === null) {
    bookingExist = false
    saveAppointment(timeSlot)
    notifyUser(bookingExist, appointment.userid)
  }
  else {
    bookingExist = true
    notifyUser(bookingExist, appointment.userid)
  }
}

var notifyUser = (bookingExist, userid) => {

  let bookingSuccess = 'Your selected time has been booked!'
  let bookingFailed = 'This timeslot is already booked please try a new one!'

  client.publish(userid, bookingExist ? bookingFailed : bookingSuccess)
}
