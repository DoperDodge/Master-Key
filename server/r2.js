const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(fileBuffer, originalName, mimetype) {
  const ext = originalName.split('.').pop();
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  }));

  // Public URL — requires making bucket public (see Part 6)
  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { key, url };
}

module.exports = { uploadToR2 };
