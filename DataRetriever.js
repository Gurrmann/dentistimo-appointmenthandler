var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://broker.hivemq.com')
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/dentistimoDB')
var Appointment = require('./models/appointment')

process.on('exit', exitHandler.bind(null));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

function exitHandler(options, exitCode) {
  if (options.exit){ 
    client.unsubscribe('validBookingRequest')
    console.log("client unsubscribed")
    client.end()
    console.log("client ended")

    process.exit()
  }
}

client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {

  try {
    var timeSlot = JSON.parse(message)
    if(timeSlot !== null && typeof timeSlot === 'object') {
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
  // Finds the amount of booked appointments on the booking's requested time slot 
  // and checks if the request can be booked by comparing the number to
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
  // Create a number representing the day the appointment was made, to be used for filtering
  var dateInMilliseconds = new Date(data.time.split(' ')[0]) // Gets the YYYY-MM-DD
  var appointmentData = {
    dentistry: data.dentistid,
    timeSlot: data.time,
    userId: data.userid,
    dateInMilliseconds: dateInMilliseconds.getTime()
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
  let options = { qos: 2 } // make sure response is sent and only once

  client.publish(`${booking.userid}`, bookingExist ? bookingFailed : bookingSuccess, options)
}

setInterval(function(){
  var today = new Date() // Gets todays date
  today.setHours(0)      // Clears hours, minutes etc.
  let options = { retain: true }
  // Finds all appointments which was booked today or later
  Appointment.find({dateInMilliseconds: {$gte: today.getTime()}}, 'dentistry timeSlot', function(err, result){
    if(err){
      console.log(err)
    } else {
      client.publish('appointments', JSON.stringify(result), options)
    }
  })
}, 2000) // 2 sec