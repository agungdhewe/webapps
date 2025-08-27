import context from './../context.js'
import * as helper from './../helper.js'
import * as path from 'node:path'


export async function defaultRootIndex(req, res, next) {
	const variables	= {
		...helper.createDefaultEjsVariable(req),
		...{

		}
	}
	const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'index.ejs')
	const content = await helper.parseTemplate(tplFilePath, variables)
	res.status(200).send(content)
}