/*jslint node: true */

/* 
 * Requests the accelerometer, temperature, and sets the color randomly evry second.
 * This requires no specific sketch on the Arduino. All of this is just talking to the bean's radio. 
 */

"use strict";
var winston = require('winston');
var Bean = require('ble-bean');
var connectedBean;

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ timestamp: true, colorize: true }),
    ]
});

/**
 * Starts discovery and runs onConnect once a bean was discovered.
 * 
 * @param eventName Subscribes to the given event
 * @param callback the event handler
 * @param onConnect the handler function after the bean has been connected
 */
function discover(eventName, eventCallback, onConnect) {
    var intervalId;

    //TODO support multiple events.
    logger.info('Starting discovery...');

    Bean.discover(function (bean) {
        connectedBean = bean;
        process.on('SIGINT', exitHandler.bind(this));

        bean.on("disconnect", function () {
            logger.info("Disconnected");
        });

        logger.info("Bean discovered.");
        if (eventName != null) {
            bean.on(eventName, eventCallback);
        }
        onConnect(connectedBean);
    });
}


function doRequest(bean, request) {
    logger.info("Connecting to bean...");
    bean.connectAndSetup(function () {
        logger.info("Connected.");

        /*
                bean.notifyTwo(
                    //called when theres data
                    function (data) {
                        //logger.info('Getting data');
                        if (data && data.length >= 4) {
                            logger.info("Scratch bank 2: 0x" + data.toString('hex'));
        
                            var batteryVoltage = (data[1] << 8) | (data[0]);
                            var batteryLevel = data[2];
                            var temperature = data[3];
        
                            logger.info("Voltage: %d, Level: %d, Temperature: %d", batteryVoltage, batteryLevel, temperature);
                            var logValues = {
                                voltage: batteryVoltage,
                                level: batteryLevel,
                                temperature: temperature
                            };
                        }
                    },
                    //called when the notify is successfully or unsuccessfully setup
                    function (error) {
                        if (error) logger.error("Setting up notification for scratch bank 2 failed.");
                    });
        
        */
        bean.readBatteryLevel(function (battery) {
            logger.info('BatteryLevel: ' + battery)
        });
        request(bean);
    });
}

function requestTemp(bean) {
    doRequest(bean, function () {
        bean.requestTemp(

            function () {
                logger.info("request temp sent");
            });
    });
}

function requestScratch(scratchCallback) {

    return function (bean) {
        doRequest(bean, function () {

            bean.readOne(function (data) {
                logger.info("request scratch sent, got: 0x" + data.toString('hex'));
                scratchCallback(data);
                //bean.disconnect();				
            });
        });
    }
}

function updateScratch(scratchCallback, value) {

    return function (bean) {

        doRequest(bean, function () {

            bean.writeOne(new Buffer([value]), function () {
                logger.info('scratch update sent: ' + value);
                scratchCallback();
                //bean.disconnect();
            });
        });
    }
}



var connectAndGetTemp = function (tempCallback) {

    // discover needs to take a list of event configs and a list of on connect functions
    if (!connectedBean) {
        discover("temp", function (temp, valid) {
            var status = valid ? "valid" : "invalid";
            logger.info("received " + status + " temp:\t" + temp);
            tempCallback(temp);
        }, requestTemp);
    } else {
        requestTemp(connectedBean);
    }
}

var connectAndGetScratch = function (callback) {

    if (!connectedBean) {
        discover(null, null, requestScratch(callback));
    } else {
        requestScratch(callback)(connectedBean);
    }
}


var connectAndUpdateScratch = function (callback, value) {

    if (!connectedBean) {
        discover(null, null, updateScratch(callback, value));
    } else {
        updateScratch(callback, value)(connectedBean);
    }
}

var triedToExit = false;
process.stdin.resume();//so the program will not close instantly

//turns off led before disconnecting
var exitHandler = function exitHandler() {

    var self = this;
    if (connectedBean && !triedToExit) {
        triedToExit = true;
        logger.info('Turning off led...');
        connectedBean.setColor(new Buffer([0x0, 0x0, 0x0]), function () { });
        //no way to know if succesful but often behind other commands going out, so just wait 2 seconds
        setTimeout(connectedBean.disconnect.bind(connectedBean, function () { }), 2000);
    } else {
        logger.info("Exiting process")
        process.exit();
    }
};

//TODO: provide a way to disconnect from bean and/or to pass an option in the calls
module.exports = {
    getTemp: connectAndGetTemp,
    getScratchOne: connectAndGetScratch,
    updateScratchOne: connectAndUpdateScratch,
    logger: logger
};
