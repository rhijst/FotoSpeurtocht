const {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://minio:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
  },
  forcePathStyle: true,
});

const bucketName = process.env.MINIO_BUCKET || "targets";

async function initMinio() {
  try {

    // 1. Check if bucket exists
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log("Bucket created");
    } 
    catch (err) {
      // Race condition, of 2 containers launched the same time and checked when no bucket existed
      if (
        err.name === "BucketAlreadyOwnedByYou" ||
        err.name === "BucketAlreadyExists"
      ) {
        console.log("Bucket already exists (race condition safe)");
      } else {
        throw err;
      }
    }

    // 2. Set public policy
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      })
    );

    console.log(`Bucket "${bucketName}" is ready and public`);
  } catch (err) {
    console.error("MinIO init failed:", err.message);
  }
}

module.exports = initMinio;