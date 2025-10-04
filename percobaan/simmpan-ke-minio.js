import { Client } from 'minio';

const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'admin',
  secretKey: 'gacutils13#!',
});

const uploadFile = async () => {
  const bucketName = 'testupload';
  const objectName = '123543/testfile.txt';
  const filePath = './src/datalog.sql';

  try {
    await minioClient.fPutObject(bucketName, objectName, filePath);
    console.log(`✅ File '${objectName}' uploaded to '${bucketName}'`);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
};

uploadFile();