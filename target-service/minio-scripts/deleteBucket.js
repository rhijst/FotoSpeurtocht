const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: "http://localhost:9000", // MinIO URL
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true,
});

const bucketName = "targets";

async function deleteBucket() {
  try {
    // List all objects
    const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
    if (Contents && Contents.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: Contents.map(obj => ({ Key: obj.Key })),
        },
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));
      console.log("All objects deleted from bucket.");
    }

    // Delete the bucket itself
    await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" deleted.`);
  } catch (err) {
    console.error("Error deleting bucket:", err.message);
  }
}

deleteBucket();