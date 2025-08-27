import context from './../context.js'
import * as helper from './../helper.js'
import * as http from 'node:http'
import * as path from 'node:path'


export async function handleError(err, req, res) {
	const appName = req.app.locals.appConfig.appName || ''
	const moduleName = req.params.modulename || req.url
	const status = err.status || 500
	const statusText =  http.STATUS_CODES[status]
	const code = err.code ?? 1

	console.log(err)
	console.log(moduleName)

	const response = {
		code,
		status,
		statusText,
		appName,
		moduleName
	}

	if (req.method=='POST') {
		// kalau post (api), kirimkan berupa json
		response.message = "API: " + err.message
		res.status(status).json(response)
		
	} else {
		// kalau selain post, kirimkan halaman error
		const variables = {
			...response,
			...{
				message: err.message
			}
		}
		const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'moduleError.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)
		res.status(status).send(content)

	}
}