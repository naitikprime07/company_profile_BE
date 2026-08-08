const { S3Client } = require("@aws-sdk/client-s3");

function getR2Config() {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }

  return {
    bucket: process.env.R2_BUCKET_NAME.trim(),
    publicUrl: process.env.R2_PUBLIC_URL.trim().replace(/\/$/, ""),
  };
}

function createR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

module.exports = { createR2Client, getR2Config };
