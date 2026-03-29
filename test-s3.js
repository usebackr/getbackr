const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({
  region: 'eu-west-1', 
  credentials: { accessKeyId: 'dummy', secretAccessKey: 'dummy' },
  // NO forcePathStyle
  endpoint: 'https://enlmurwayokqsrusxytu.supabase.co/storage/v1/s3'
});
s3.send(new PutObjectCommand({ Bucket: 'backr-uploads', Key: 'test.jpg', Body: 'hello' })).catch(console.error);
