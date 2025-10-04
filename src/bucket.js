import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();


const bucketHost = process.env.BUCKET_HOST
const bucketPort = process.env.BUCKET_PORT
const bucketSecure = process.env.BUCKET_SECURE === 'true'
const bucketUsername = process.env.BUCKET_USERNAME
const bucketSecret = process.env.BUCKET_SECRET


const minioClient = new Client({
	endPoint: bucketHost,
	port: bucketPort,
	useSSL: bucketSecure,
	accessKey: bucketUsername,
	secretKey: bucketSecret,
});


export default minioClient

