import context from './../context.js'
import fs from 'fs/promises';
import path from 'node:path';
import * as helper from './../helper.js'

import { handleError } from './handleError.js';



async function getCurrentVersion(filepath) {
	const previousVersionNumber = await fs.readFile(filepath, 'utf8');
	return previousVersionNumber
}

export async function modulePage(req, res) {
	const moduleName = req.params.modulename;
	const fullUrlWithHostHeader = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
	const __rootDir = context.getRootDirectory()

	const fgta5jsDebugMode = req.app.locals.appConfig.fgta5jsDebugMode
	const fgta5jsVersion = req.app.locals.appConfig.fgta5jsVersion
	const appDebugMode = req.app.locals.appConfig.appDebugMode

	const moduleDir = path.join(__rootDir, 'public', 'modules', moduleName)
	const ejsPath = path.join(__rootDir, 'public', 'modules', moduleName, `${moduleName}.ejs`)
	const cssPath = path.join(__rootDir, 'public', 'modules', moduleName, `${moduleName}.css`);
	const cssLayoutPath = path.join(__rootDir, 'public', 'modules', moduleName, `${moduleName}.layout.css`);
	const cssApplicationPath = path.join(__rootDir, 'public', 'local', 'application.css');


	const variance = req.query.variance;
	const id = req.query.id;


	// const mjsFileName = appDebugMode ? `${moduleName}.mjs` : `${moduleName}.min.mjs`
	let useCssBundle
	let cssBundleFileName
	let mjsFileName
	if (appDebugMode) {
		// Default Debug
		if (req.query.mode == 'release') {
			const version = await getCurrentVersion(path.join(__rootDir, 'public', 'modules', moduleName, 'version.txt'))
			mjsFileName = `${moduleName}-${version}.min.mjs`
			cssBundleFileName = `${moduleName}-${version}.min.css`
			useCssBundle = true
		} else {
			mjsFileName = `${moduleName}.mjs`
			useCssBundle = false
		}
	} else {
		// Default Production
		if (req.query.mode == 'debug') {
			mjsFileName = `${moduleName}.mjs`
			useCssBundle = false
		} else {
			const version = await getCurrentVersion(path.join(__rootDir, 'public', 'modules', moduleName, 'version.txt'))
			mjsFileName = `${moduleName}-${version}.min.mjs`
			cssBundleFileName = `${moduleName}-${version}.min.css`
			useCssBundle = true
		}
	}
	const mjsPath = path.join(__rootDir, 'public', 'modules', moduleName, mjsFileName);


	const htmlExtenderFile = `${moduleName}-ext.html`
	const htmlExtenderPath = path.join(__rootDir, 'public', 'modules', moduleName, htmlExtenderFile)

	const iconFileName = `${moduleName}.svg`
	const iconFilePath = path.join(__rootDir, 'public', 'modules', moduleName, iconFileName)

	const cssLayoutExists = await helper.isFileExists(cssLayoutPath)
	const cssExists = await helper.isFileExists(cssPath)
	const mjsExists = await helper.isFileExists(mjsPath);
	const htmlExtenderExists = await helper.isFileExists(htmlExtenderPath);
	const iconFileExists = await helper.isFileExists(iconFilePath);

	const cssApplicationExists = await helper.isFileExists(cssApplicationPath);

	const mjsPrerenderPath = path.join(__rootDir, 'public', 'modules', moduleName, `${moduleName}-prerender.mjs`);
	const mjsPrerenderExists = await helper.isFileExists(mjsPrerenderPath)


	const ejsModuleExist = await helper.isFileExists(ejsPath)

	const additionalHeaderPath = path.join(__rootDir, 'public', 'modules', moduleName, `_htmlheader.ejs`);
	const additionalHeaderExists = await helper.isFileExists(additionalHeaderPath)

	try {

		// coba cek request halaman
		const fnParseModuleRequest = context.getFnParseModuleRequest()
		if (typeof fnParseModuleRequest === 'function') {
			await fnParseModuleRequest(req, res)
		}


		// load halaman html-nya
		if (!ejsModuleExist) {
			const err = new Error(`requested module '${moduleName}' is not found`)
			err.status = 404
			throw err
		}

		const variables = {
			...helper.createDefaultEjsVariable(req),
			...{
				id,
				variance,
				moduleDir,
				ejsPath,
				mjsPrerenderExists,
				cssLayoutExists,
				cssExists,
				mjsExists,
				mjsFileName,
				htmlExtenderExists,
				htmlExtenderPath,
				iconFileName,
				iconFileExists,
				additionalHeaderPath,
				additionalHeaderExists,
				cssApplicationPath,
				cssApplicationExists,
				setting: req.app.locals.appConfig,
				useCssBundle,
				cssBundleFileName,
			}
		}

		const tplFilePath = path.join(context.getWebappsDirectory(), 'templates', 'application.page.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)

		res.status(200).send(content)
	} catch (err) {
		handleError(err, req, res)
	}
}