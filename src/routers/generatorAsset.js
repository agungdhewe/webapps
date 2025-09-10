import context from '../context.js'
import fs from 'fs/promises';
import path from 'node:path';
import * as helper from '../helper.js'


export async function generatorAsset(req, res, next) {
	const __dirname = context.getWebappsDirectory()
	const requestedFile = req.params.requestedAsset;
	const filePath = path.join(__dirname, 'modules', 'generator', requestedFile)

	const assetExists = await helper.isFileExists(filePath)
	if (assetExists) {
		res.sendFile(filePath)
	} else {
		res.status(404).send(`'${requestedFile}' is not found`)
	}
}