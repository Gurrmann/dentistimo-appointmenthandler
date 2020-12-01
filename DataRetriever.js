var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://test.mosquitto.org')

client.on('connect', function () {
  client.subscribe('validBookingRequest')
})

client.on('message', function (topic, message) {
  message = JSON.parse(message)

})
