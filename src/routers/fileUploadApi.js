

export async function fileUploadApi(req, res, next) {

	const moduleName = 'xxxxxx'
	const ModuleClass = await importModule(moduleName)
	const module = new ModuleClass(req, res, next)
	
	try {
		const response = await module.handleRequest('upload', req.body)
		res.send(response)
	} catch (err) {
		next(err);
	}
}