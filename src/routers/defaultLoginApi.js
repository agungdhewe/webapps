import * as helper from './../helper.js'
import { handleError } from './handleError.js'


export async function defaultLoginApi(req, res, next) {
	const moduleName = 'login'
	const methodName = req.params.method

	try {

		const ModuleClass = await helper.importApiModule(moduleName)
		const method = helper.kebabToCamel(methodName);
		if (ModuleClass===undefined) {
			throw new Error(`invalid module: '${moduleName}'`)
		}

		const requestedBody = req.body
		const module = new ModuleClass(req, res, next)
		const result = await module.handleRequest(method, requestedBody)
		const response = {
			code: 0,
			result: result
		}
		res.json(response)
	} catch (err) {
		handleError(err, req, res)
	}
	
}