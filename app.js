var AWS = require('aws-sdk');
var unirest = require('unirest');
var JSFTP = require('jsftp');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3({ apiVersion: 'latest',httpOptions:{timeout:3000} });
//var s3 = new AWS.S3({ apiVersion: '2006-03-01',httpOptions:{timeout:3000} });

// const l_url='http://localhost:3000/';
// const s_url='http://seller.haappyapp.com:8080/';
// const api_url=s_url;
exports.handler = function (event, context, callback) {
    // This example code only throws error. 
    var error = new Error("something is wrong");
    callback(error);
    var eventKey= event.Records[0].s3.object.key;

    console.log(eventKey);
    //var eventKey  = 'ka-mob-prajaa-pj-manju1_2017-09-21-14.18.08.889-UTC_0.mp4'
    var mainKey = eventKey.split('/')[1];
    console.log(mainKey);
    var underscoreBreaker = mainKey.split('_');

    var hyphenBreaker = underscoreBreaker[0].split('-');
    var appln_name = hyphenBreaker[0] + '-' + hyphenBreaker[1] + '-' + hyphenBreaker[2];
    var stream_name = underscoreBreaker[0];
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
            console.log(journalSettings);

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
                            console.log('file saved');
                            unirest.post("http://seller.haappyapp.com:8080/journal/log/activity")
                                .headers({
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                })
                                .send({
                                    journal_setting_id: journalSettings.journal_setting_id,
                                    language_id: journalSettings.language_id,
                                    appln_name: journalSettings.appln_name,
                                    host_url: journalSettings.host_url,
                                    host_port: journalSettings.host_port,
                                    stream_name: journalSettings.stream_name,
                                    spwd: journalSettings.spwd,
                                    rep_mac_addr: journalSettings.rep_mac_addr,
                                    output_url_hls: journalSettings.output_url_hls,
                                    output_url_rtsp: journalSettings.output_url_rtsp,
                                    is_record: journalSettings.is_record,
                                    is_upload: journalSettings.is_upload,
                                    is_active: journalSettings.is_active,
                                    created_by: journalSettings.created_by,
                                    updated_by: journalSettings.updated_by,
                                    created_time: journalSettings.created_time,
                                    updated_time: journalSettings.updated_time,
                                    ftp_host: journalSettings.ftp_host,
                                    ftp_port: journalSettings.ftp_port,
                                    ftp_uname: journalSettings.ftp_uname,
                                    ftp_passwd: journalSettings.ftp_passwd,
                                    ftp_path: journalSettings.ftp_path,
                                    bucket_path: 'https://s3.ap-south-1.amazonaws.com/haappyapp-j/' + eventKey
                                })
                                .end(function (logResponse) {
                                    var logPost = logResponse.body;
                                    
                                        // s3.deleteObject(bucketParams, function(deleteErr, deleteData){
                                        //     if(deleteErr){
                                        //         console.log(deleteErr);
                                        //     } else {
                                        //         console.log(deleteData);
                                        //     }
                                        // });
                                        var ftpClient2 = new JSFTP({
                                            host: journalSettings.ha_ftp_host,
                                            port: journalSettings.ha_ftp_port,
                                            user: journalSettings.ha_ftp_uname,
                                            pass: journalSettings.ha_ftp_passwd 
                                        });
                                        ftpClient2.raw('dele', journalSettings.ha_ftp_path+'/'+mainKey, function(err, rdata){
                                            if(err){
                                                console.log(err);
                                            } else {
                                                console.log(rdata);
                                                ftpClient2.raw('dele', journalSettings.ha_ftp_path + '/' + mainKey+'.upload', function (err, rdata) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        console.log(rdata);
                                                    }
                                                });
                                            }
                                        });
                                    
                                });
                        }
                    });
                }
            });
        });
};