const AWS = require('aws-sdk');

const s3Config = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  region: process.env.S3_REGION || 'us-east-1',
};

if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  s3Config.s3ForcePathStyle = true;
}

const s3 = new AWS.S3(s3Config);
const BUCKET = process.env.S3_BUCKET || 'm3d-bucket';

function generateKey(projectId, filename) {
  const prefix = projectId ? `projects/${projectId}/` : 'misc/';
  const ts = Date.now();
  return `${prefix}${ts}_${filename}`;
}

async function getPresignPutUrl({ projectId, filename, contentType, expires = 60 }) {
  const key = generateKey(projectId, filename);
  const params = {
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'private'
  };
  const uploadUrl = await s3.getSignedUrlPromise('putObject', { ...params, Expires: expires });
  return { uploadUrl, key, expiresIn: expires };
}

async function getPresignGetUrl(key, expires = 60) {
  const params = { Bucket: BUCKET, Key: key, Expires: expires };
  const url = await s3.getSignedUrlPromise('getObject', params);
  return url;
}

async function uploadFromBuffer(key, buffer, contentType) {
  const params = { Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType };
  return s3.upload(params).promise();
}

async function deleteObject(key) {
  const params = { Bucket: BUCKET, Key: key };
  return s3.deleteObject(params).promise();
}

module.exports = { getPresignPutUrl, getPresignGetUrl, uploadFromBuffer, deleteObject, BUCKET };
