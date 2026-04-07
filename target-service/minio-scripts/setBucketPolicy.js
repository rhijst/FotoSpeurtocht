const { S3Client, PutBucketPolicyCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true,
});

const bucketName = "targets";

async function setPublicPolicy() {
  try {
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

    console.log(`Bucket "${bucketName}" is now public.`);
  } catch (err) {
    console.error("Error setting bucket policy:", err.message);
  }
}

// Run the async function
setPublicPolicy();