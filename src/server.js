/**Will connect to the bean on a given interval
 * and publish the results to AWS IoT
 */

var bean = require('./light-blue-bean.js');
var awsIot = require('aws-iot-device-sdk');

//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourAWSRegion>'
// with a unique client identifier and the AWS region you created your
// certificate in (e.g. 'us-east-1').  NOTE: client identifiers must be
// unique within your AWS account; if a client attempts to connect with a
// client identifier which is already in use, the existing connection will
// be terminated.
//
var params = {
    //"host": "A1HLXT2PAX76T6.iot.eu-central-1.amazonaws.com",
    //"port": 8883,
    "region": "eu-central-1",
    "clientId": "bluebean",
    //"thingName": "bluebean",
    "caCert": "cert/root-CA.crt",
    "clientCert": "cert/certificate.pem.crt",
    "privateKey": "cert/private.pem.key"
}

var thingShadows = awsIot.thingShadow(params);

thingShadows
    .on('message', function (topic, payload) {
        console.log('message', topic, payload.toString());
    });

//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
thingShadows
    .on('connect', function () {
        console.log('connect');
        thingShadows.subscribe('topic_1');
        thingShadows.publish('topic_2', JSON.stringify({ test_data: 1 }));

    });


thingShadows.register('bluebean', {});

thingShadows.update('bluebean', {
    state: {
        reported: { temp: 10 }
    }

});

thingShadows.on('status',
    function (thingName, stat, clientToken, stateObject) {
        console.log('received ' + stat + ' on ' + thingName + ': ' +
            JSON.stringify(stateObject, null, 2));
    });

thingShadows.on('delta',
    function (thingName, stateObject) {
        console.log('received delta on ' + thingName + ': ' +
            JSON.stringify(stateObject, null, 2));
        t = stateObject.state.temp;
        console.log(t);
        thingShadows.update(thingName, { state: { reported: { temp: t } } })
    });

thingShadows.on('timeout',
    function (thingName, clientToken) {
        console.log('received timeout on ' + thingName +
            ' with token: ' + clientToken);
    });

thingShadows.on('error', function (error) {
    console.log('error', error);
});

var i = 1;
setInterval(function () {
    i++;
    var ts = new Date().getTime();;
    thingShadows.publish('lars/iot/bluebean/temp', JSON.stringify({
        temp: i,
        timestamp: ts
    }));
}, 10000);



/*
bean.getTemp(function(t){
    console.log('Current temp is: ' + t);
})
*/

