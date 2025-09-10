import context from './../context.js'
import * as helper from './../helper.js'
import * as path from 'node:path'
import { handleError } from './handleError.js'


export async function defaultLoginAsset(req, res, next) {
	const __dirname = context.getMyDirectory()
	const requestedFile = req.params.requestedAsset;
	const filePath = path.join(__dirname, 'modules', 'login', requestedFile)

	const assetExists = await helper.isFileExists(filePath)
	if (assetExists) {
		res.sendFile(filePath)
	} else {
		res.status(404).send(`'${requestedFile}' is not found`)
	}
}