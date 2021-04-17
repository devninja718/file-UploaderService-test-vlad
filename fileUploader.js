"use strict";
const AWS = require("aws-sdk");
const uuid = require("uuid/v4");
const s3 = new AWS.S3();
const formParser = require("./formParser");

const bucket = process.env.Bucket;
const MAX_SIZE = 4000000; // 4MB
const PNG_MIME_TYPE = "image/png";
const JPEG_MIME_TYPE = "image/jpeg";
const JPG_MIME_TYPE = "image/jpg";
const MIME_TYPES = [PNG_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE];

module.exports.handler = async (event) => {
	try {
		const formData = await formParser.parser(event, MAX_SIZE);
		const file = formData.files[0];

		if (!isAllowedFile(file.content.byteLength, file.contentType))
			getErrorMessage("File size or type not allowed");

		const uid = uuid();

		const originalKey = event.requestContext.path.split("upload-avatar/")[1] || `${uid}_${file.filename}`;

		const originalFile = await uploadToS3(
			bucket,
			originalKey,
			file.content,
			file.contentType
		);

		const signedOriginalUrl = s3.getSignedUrl("getObject", {
			Bucket: originalFile.Bucket,
			Key: originalKey,
			Expires: 60000,
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				id: uid,
				mimeType: file.contentType,
				originalKey: originalFile.key,
				bucket: originalFile.Bucket,
				fileName: file.filename,
				originalUrl: signedOriginalUrl,
				originalSize: file.content.byteLength,
			}),
		};
	} catch (e) {
		return getErrorMessage(e.message);
	}
};

const getErrorMessage = (message) => ({
	statusCode: 500,
	body: JSON.stringify(message),
});

const isAllowedFile = (size, mimeType) => {
	if (size <= MAX_SIZE && MIME_TYPES.includes(mimeType)) return true;
	return false;
};

const uploadToS3 = (bucket, key, buffer, mimeType) =>
	new Promise((resolve, reject) => {
		s3.upload(
			{ Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType },
			function (err, data) {
				if (err) reject(err);
				resolve(data);
			}
		);
	});
