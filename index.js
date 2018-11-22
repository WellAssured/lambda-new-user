const AWS = require('aws-sdk');

const sns = new AWS.SNS();
const sqs = new AWS.SQS();

exports.handler = async (event, context, callback) => {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        // Publish to NewUser SNS Topic
        // event.userName, event.request.userAttributes["custom:zip"]
        const message = `Welcome ${event.userName} to tailRD! Reported Zip Code: ${event.request.userAttributes["custom:zip"]}`;
        sns.publish({
            TopicArn: process.env.newuser_snstopic_arn,
            Message: message
        }).promise().catch((err) => console.error(err, err.stack));
        
        const sqsMessage = {
            QueueUrl: process.env.sqs_url,
            MessageBody: JSON.stringify({
                newUser: {
                    sub: event.request.userAttributes.sub,
                    name: event.userName
                }
            }),
            MessageAttributes: {
                userPoolId: {
                    DataType: "String",
                    StringValue: event.userPoolId
                },
                clientId: {
                    DataType: "String",
                    StringValue: event.callerContext.clientId
                }
            }
        };
        sqs.sendMessage(sqsMessage, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
            }
        })
    }
    callback(null, event);
};
