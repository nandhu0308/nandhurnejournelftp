var AWS = require('aws-sdk');
var unirest = require('unirest');
var JSFTP = require('jsftp');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// const l_url='http://localhost:3000/';
// const s_url='http://seller.haappyapp.com:8080/';
// const api_url=s_url;
exports.handler = function (event, context, callback) {

    // This example code only throws error. 
    var error = new Error("something is wrong");
    callback(error);

    var eventKey = event.Records[0].s3.object.key;
    console.log(eventKey);
    //var eventKey  = 'ka-mob-prajaa-pj-manju1_2017-09-21-14.18.08.889-UTC_0.mp4'
    var mainKey = eventKey.split('/')[1];
    console.log(mainKey);
    var underscoreBreaker = mainKey.split('_');

    var hyphenBreaker = underscoreBreaker[0].split('-');
    var appln_name = hyphenBreaker[0] + '-' + hyphenBreaker[1] + '-' + hyphenBreaker[2];
    var stream_name = hyphenBreaker[3] + '-' + hyphenBreaker[4];
    console.log('applnname : ' + appln_name);
    console.log('stream_name : ' + stream_name);

    var bucketParams = {
        Bucket: 'haappyapp-j/myFiles',
        Key: mainKey
    };

    unirest.get('http://seller.haappyapp.com:8080/journal/settings/' + appln_name + '/' + stream_name)
        .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        .end(function (response) {
            var journalSettings = response.body;

            var ftpClient = new JSFTP({
                host: journalSettings.ftp_host,
                port: journalSettings.ftp_port,
                user: journalSettings.ftp_uname,
                pass: journalSettings.ftp_passwd
            });

            s3.getObject(bucketParams, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                    ftpClient.put(data.Body, './' + mainKey, function (err1) {
                        if (err1) {
                            console.log(err1);
                        } else {
                            console.log('file saved'); cls
                        }
                    });
                }
            });
        });
};