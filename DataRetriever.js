var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var db = mongoose.connection;
var Appointment = require('./models/appointments');
const appointment = require('./models/appointment');

client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {
  var timeSlot = JSON.parse(message)
  checkBooking(timeSlot)


})

var checkBooking = (timeSlot) => {

  Appointment.find({ dentistry: timeSlot.dentistid, timeSlot: timeSlot.timeSlot },function(err, result) {
    if (err)
    var bookingExist

    if (result === null) {
      bookingExist = false
      saveAppointment(timeSlot)
      notifyUser(bookingExist, appointment.userid)
    }
    else {
      bookingExist = true
      notifyUser(bookingExist, appointment.userid)
    }
  }
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

  let bookingSuccess = 'Your selected time has been booked!'
  let bookingFailed = 'This timeslot is already booked please try a new one!'

  client.publish(userid, bookingExist ? bookingFailed : bookingSuccess)
}
