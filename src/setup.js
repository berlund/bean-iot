var AWS = require('aws-sdk');
var iot = new AWS.Iot({ region: 'eu-central-1' });

var certArn;

var params = {
    setAsActive: true
};
iot.createKeysAndCertificate(params)
    .promise()
    .then(result => {
        //console.log(result);
        //TODO: save keys and cert to file
        return Promise.resolve(result.certificateArn);
    })
    .then(arn => {
        var principalParams = {
            principal: arn,
            policyName: 'bluebean-Policy'
        }
        iot.attachPrincipalPolicy(principalParams)
            .promise()
            .then(r => {

                console.log(r);
                return Promise.resolve(r)
            })
            .catch(e => { console.log(e) })
        return Promise.resolve(arn)
    })
    .then(r => {
        var principalParams = {
            principal: r,
            thingName: 'bluebean'
        }
        iot.attachThingPrincipal(principalParams)
            .promise()
            .then(r2 => {
                console.log(r2);
                return Promise.resolve(r2)
            })
            .catch(e => { console.log(e) })
    })
    .catch(e => { console.log(e) });