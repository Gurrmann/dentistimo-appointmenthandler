var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://test.mosquitto.org')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var Appointment = require('./models/appointment')

var options = {
  retain: true
}

client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {

  try {
    var timeSlot = JSON.parse(message)
    if(timeSlot!==null && typeof timeSlot==='object') {
      checkBooking(timeSlot)
    }
  } catch (error) {

  }
})

var checkBooking = (booking) => {
  //Number of dentists defaults to 1
  var dentistNumber = 1
  //This if-statement makes sure that the value received from the request's dentist number data is not undefined before updating the value of dentistNumber
  if(typeof booking.numberOfDentists !== 'undefined'){
    dentistNumber = booking.numberOfDentists
  }
      
      // Finds the amount of booked appointments on the booking's requested time slot and checks if the request can be booked by comparing the number to
      // the amount of dentists working at the requested dentistry.
      Appointment.find({ dentistry: booking.dentistid, timeSlot: booking.time},function(err, result) {
        if (err)
        var bookingExist
        if (result.length < dentistNumber) {
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
  let bookingSuccess = `{"userid": ${booking.userid}, "requestid": ${booking.requestid}, "time": ${JSON.stringify(time)}}`
  let bookingFailed = `{"userid": ${booking.userid}, "requestid": ${booking.requestid}, "time": "none"}`

  client.publish(`${booking.userid}`, bookingExist ? bookingFailed : bookingSuccess)
}

setInterval(function(){
  Appointment.find(function(err, result){
    if(err){
      console.log(err)
    } else {
      client.publish('appointments', JSON.stringify(result), options)
    }
  })
}, 5000) // 5 sec