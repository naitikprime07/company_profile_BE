require("dotenv").config();
const { PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const { createR2Client, getR2Config } = require("../src/config/r2");

async function configureR2Cors() {
  const { bucket } = getR2Config();
  const origins = [
    "http://localhost:5173",
    ...String(process.env.CLIENT_ORIGIN || "").split(","),
  ]
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  await createR2Client().send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [...new Set(origins)],
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  console.log(`R2 CORS configured for: ${[...new Set(origins)].join(", ")}`);
}

configureR2Cors().catch((error) => {
  console.error(`Unable to configure R2 CORS: ${error.message}`);
  process.exitCode = 1;
});
