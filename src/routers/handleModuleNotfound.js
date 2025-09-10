import context from './../context.js'
import * as helper from './../helper.js'
import * as http from 'node:http'
import * as path from 'node:path'

export async function handleModuleNotfound(req, res) {
	const appName = req.app.locals.appConfig.appName || ''
	const moduleName = req.params.modulename
	const tplFilePath = path.join(context.getWebappsDirectory(), 'templates', 'moduleNotfound.ejs')
	const content = await helper.parseTemplate(tplFilePath, {appName, moduleName})
	res.status(404).send(content)
}