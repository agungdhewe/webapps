import context from '../context.js'
import fs from 'fs/promises';
import path from 'node:path';
import * as helper from '../helper.js'

import { handleError } from './handleError.js';

export async function generatorPage(req, res, next) {
	const __dirname = context.getWebappsDirectory()

	try {

		const generatorListPath = path.join(__dirname, 'modules', 'generator', 'generatorList.html')
		const generatorEditPath = path.join(__dirname, 'modules', 'generator', 'generatorEdit.html')
		const generatorDesignPath = path.join(__dirname, 'modules', 'generator', 'generator-designtemplate.html')
		const generatorModulePath = path.join(__dirname, 'modules', 'generator')

		// load halaman html-nya
		const variables	= {
			...helper.createDefaultEjsVariable(req),
			...{
				generatorListPath,
				generatorEditPath,
				generatorDesignPath,
				generatorModulePath
			}
		}

		const tplFilePath = path.join(context.getWebappsDirectory(), 'templates', 'generator.page.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)

		res.status(200).send(content)
	} catch (err) {
		handleError(err, req, res)
	}	

}


