import context from './../context.js'
import * as helper from './../helper.js'
import * as path from 'node:path'
import { handleError } from './handleError.js'

export async function defaultLoginPage(req, res, next) {
	const variables	= {
		...helper.createDefaultEjsVariable(req),
		...{

		}
	}

	try {

		res.status(200).send(`defaultLoginApi`)	
	} catch (err) {
		// next(err)
		handleError(err, req, res)
	}



}