import context from './../context.js'
import * as helper from './../helper.js'
import * as path from 'node:path'
import { handleError } from './handleError.js'

export async function defaultLoginPage(req, res, next) {
	const __dirname = context.getMyDirectory()

	try {

		const loginPagePath = path.join(__dirname, 'modules', 'login', 'login.html')

		const variables	= {
			...helper.createDefaultEjsVariable(req),
			...{
				loginPagePath
			}
		}

		const tplFilePath = path.join(__dirname, 'templates', 'login.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)

		res.status(200).send(content)		
		// res.status(200).send(`defaultLoginApi`)	

	} catch (err) {
		// next(err)
		handleError(err, req, res)
	}



}



