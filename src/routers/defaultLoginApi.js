export async function defaultLoginApi(req, res, next) {
	const err = new Error('test halaman login error')
	
	if (err) {
		err.status = 500
		next(err)
	} else {
		res.status(200).send(`defaultLoginApi`)
	}


	
}