/**
 * This script is meant to setup a new bean iot device including
 * policies and certs. Right now we're just creating the certs.
 */
var fs = require('fs');
var AWS = require('aws-sdk');
var iot = new AWS.Iot({ region: 'eu-central-1' });

var certArn;

var params = {
    setAsActive: true
};

function writeFile(path, content) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(path, content, err => {
            if (err) {
                console.log('Could not write file: ', path)
                reject(err);
            } else {
                resolve(path);
            }
        })
    });
}

function writeCerts(certs) {
    var p1 = writeFile('./certs/certificate.pem.crt', certs.certificatePem);
    var p2 = writeFile('./certs/private.pem.crt', certs.keyPair.PrivateKey);
    var p3 = writeFile('./certs/public.pem.crt', certs.keyPair.PublicKey);
    return Promise.all([p1, p2, p3]);
}

function attachPrincipalPolicy(certificateArn) {
    //TODO fetch policy from AWS or create a new one
    var principalParams = {
        principal: certificateArn,
        policyName: 'bluebean-Policy'
    }
    return iot.attachPrincipalPolicy(principalParams)
        .promise()
}

function attachThingPrincipal(certificateArn) {
    var principalParams = {
        principal: certificateArn,
        thingName: 'bluebean'
    }
    return iot.attachThingPrincipal(principalParams)
        .promise()
}

iot.createKeysAndCertificate(params)
    .promise()
    .then(result => {
        console.log(result);
        //TODO: save keys and cert to file
        return Promise.all([
            writeCerts(result),
            attachPrincipalPolicy(result.certificateArn),
            attachThingPrincipal(result.certificateArn)]);
    })
    .catch(e => { console.log(e) });