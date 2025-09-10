import context from './../context.js'
import * as helper from './../helper.js'
import { handleError } from './handleError.js'
import * as path from 'path'


export async function moduleApi(req, res, next) {
	const moduleName = req.params.modulename;
	const methodName = req.params.method
	const options = {
		apiDir: path.join(context.getRootDirectory(), 'src', 'apis')
	}

	try {

		const ModuleClass = await helper.importApiModule(moduleName, options)
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