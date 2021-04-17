"use strict";
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const bucket = process.env.Bucket;

module.exports.handler = async (event) => {
    try {
        
        const listObject = await listObjectsV2({ Bucket: bucket, MaxKeys: 1000 });

        const data = listObject.Contents.map(object => {
            return listObjectVersions({ Bucket: bucket, Prefix: object.Key })
        })

        return {
            statusCode: 200,
            body: JSON.stringify({
                allImages: data
            })
        };
    } catch (e) {
        return getErrorMessage(e.message);
    }
};

const listObjectsV2 = (param) => {
    return new Promise((resolve, reject) => {
        s3.listObjectsV2(param, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}

const listObjectVersions = (param) => {
    return new Promise((resolve, reject) => {
        s3.listObjectVersions(param, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}

const getErrorMessage = (message) => ({
	statusCode: 500,
	body: JSON.stringify(message),
});