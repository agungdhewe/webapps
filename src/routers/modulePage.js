import context from './../context.js'
import fs from 'fs/promises';
import path from 'node:path';
import * as helper from './../helper.js'

import { handleError } from './handleError.js';


export async function modulePage(req, res) {
	const moduleName = req.params.modulename;
	const fullUrlWithHostHeader = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
	const __dirname = context.getRootDirectory()

	const fgta5jsDebugMode = req.app.locals.appConfig.appDebugMode
	const fgta5jsVersion = req.app.locals.appConfig.fgta5jsVersion
	const appDebugMode = req.app.locals.appConfig.appDebugMode

	const ejsPath = path.join(__dirname, '..', 'public', 'modules', moduleName, `${moduleName}.ejs`)
	const cssPath = path.join(__dirname, '..', 'public', 'modules', moduleName, `${moduleName}.css`);
	
	const mjsFileName = appDebugMode ? `${moduleName}.mjs` : `${moduleName}.min.mjs`
	const mjsPath = path.join(__dirname, '..', 'public', 'modules', moduleName, mjsFileName);


	const htmlExtenderFile = `${moduleName}-ext.html`
	const htmlExtender = `${moduleName}/${htmlExtenderFile}`
	const htmlExtenderPath = path.join(__dirname, '..', 'public', 'modules', moduleName, htmlExtenderFile)


	const cssExists = await helper.isFileExists(cssPath)
	const mjsExists = await helper.isFileExists(mjsPath);
	const htmlExtenderExists = await helper.isFileExists(htmlExtenderPath);

	const mjsPrerenderPath = path.join(__dirname, '..', 'public', 'modules', moduleName, `${moduleName}-prerender.mjs`);
	const mjsPrerenderExists = await helper.isFileExists(mjsPrerenderPath)


	const ejsModuleExist = await helper.isFileExists(ejsPath) 

	try {
		// load halaman html-nya
		if (!ejsModuleExist) {
			const err = new Error(`requested module '${moduleName}' is not found`)
			err.status = 404
			throw err
		}
		
		const variables	= {
			...helper.createDefaultEjsVariable(req),
			...{
				ejsPath,
				mjsPrerenderExists,
				cssExists,
				mjsExists,
				mjsFileName,
				htmlExtenderExists,
				htmlExtender,
			}
		}

		const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'application.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)

		res.status(200).send(content)
	} catch (err) {
		handleError(err, req, res)
	}
}