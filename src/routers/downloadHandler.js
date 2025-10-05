import Api from '../api.js'
import bucket from '../bucket.js'

export async function publicDownloadHandler(req, res, next) {
	// hanya bisa dari public bucket
	const bucketname = 'public' 
	
	// test: /images/profiles/agung-lurik-jogja.jpg
	const objectname = req.query.path;
	if (objectname==null) {
		res.send('object tidak ditemukan')
		return
	}

	const stat = await bucket.statObject(bucketname, objectname);
	const contentType = stat.metaData['content-type']
	const originalname = stat.metaData['originalname']

	res.setHeader('Content-Type', contentType);
	res.setHeader('Content-Disposition', `attachment; filename="${originalname}"`);

	// Stream file dari MinIO ke response
	const stream = await bucket.getObject(bucketname, objectname);
	stream.pipe(res);

}



export async function privateDownloadHandler(req, res, next) {
	// harus login
	const { bucketname, objectname } = req.body

	try {
		Api.cekLogin(req)

		const stat = await bucket.statObject(bucketname, objectname);
		const contentType = stat.metaData['content-type']
		const originalname = stat.metaData['originalname']

		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Disposition', `attachment; filename="${originalname}"`);

		// Stream file dari MinIO ke response
		const stream = await bucket.getObject(bucketname, objectname);
		stream.pipe(res);
	} catch (err) {
		throw err
	}

}
