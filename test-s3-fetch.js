const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { FetchHttpHandler } = require('@smithy/fetch-http-handler');

const s3 = new S3Client({
  region: 'eu-west-1',
  credentials: { accessKeyId: 'dummy123', secretAccessKey: 'dummy123' },
  forcePathStyle: true,
  endpoint: 'https://enlmurwayokqsrusxytu.supabase.co/storage/v1/s3',
  requestHandler: new FetchHttpHandler(),
});
s3.send(new PutObjectCommand({ Bucket: 'backr-uploads', Key: 'test.jpg', Body: 'hello' })).catch(console.error);
