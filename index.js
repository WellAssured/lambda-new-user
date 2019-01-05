const AWS = require('aws-sdk');

const sns = new AWS.SNS();
const sqs = new AWS.SQS();

exports.handler = async (event, context, callback) => {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        // First, figure out which SNS Topic to publish to based on promo code (default is Lora's)
        const topicArnMap = JSON.parse(process.env.newuser_snstopic_arn_map);
        const promo = event.request.userAttributes["custom:promo"].toLowerCase();
        let topicArn = process.env.topicArnMap['Lora'];
        if (promo !== undefined && Object.keys(process.env.topicArnMap).includes(promo)) {
            topicArn = process.env.topicArnMap[promo];
        }

        // Publish to NewUser SNS Topic
        // event.userName, event.request.userAttributes["custom:zip"]
        const message = `Welcome ${event.userName} to tailRD! Reported Zip Code: ${event.request.userAttributes["custom:zip"]}`;
        sns.publish({
            TopicArn: topicArn,
            Message: message
        }).promise().catch((err) => console.error(err, err.stack));
        
        const sqsMessage = {
            QueueUrl: process.env.sqs_url,
            MessageBody: JSON.stringify({
                newUser: {
                    sub: event.request.userAttributes.sub,
                    name: event.userName,
                    promo
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
