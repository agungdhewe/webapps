import ExpressServer from 'express'
import multer from 'multer';
import fs from 'fs/promises';
import * as path from 'node:path'
import * as http from 'node:http' 
import * as helper from './helper.js'
import { fileURLToPath } from 'node:url';
import context from './context.js'





export default {
	createBasicRouter: () => { return createBasicRouter() }
} 


export function uploader(req, res, next) {
	if (req.is('multipart/form-data')) {
		upload.any()(req, res, next);
	} else {
		next();
	}
}

export async function handleModuleNotfound(req, res) {
	const appName = req.app.locals.appConfig.appName || ''
	const moduleName = req.params.modulename
	const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'moduleNotfound.ejs')
	const content = await helper.parseTemplate(tplFilePath, {appName, moduleName})
	res.status(404).send(content)
}




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

export function createBasicRouter() {
	const router = ExpressServer.Router({ mergeParams: true });
	router.get('/', defaultRootIndex)
	router.post('/upload', fileUploadApi)
	router.get('/login', defaultLoginPage)
	router.post('/login/:method', defaultLoginApi)
	router.get('/generator', defaultGeneratorPage)
	router.post('/generator/:method', defaultGeneratorApi)
	router.get('/:modulename', moduleLoader)
	router.post('/:modulename/:method', apiExecutor)
	return router
}




async function fileUploadApi(req, res, next) {

	const moduleName = 'xxxxxx'
	const ModuleClass = await importModule(moduleName)
	const module = new ModuleClass(req, res, next)
	
	try {
		const response = await module.handleRequest('upload', req.body)
		res.send(response)
	} catch (err) {
		next(err);
	}
}


async function defaultRootIndex(req, res, next) {
	const appName = req.app.locals.appConfig.appName || ''
	const variables	= {
		appName
	}

	const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'index.ejs')
	const content = await helper.parseTemplate(tplFilePath, variables)
	res.status(200).send(content)
}


async function defaultLoginPage(req, res, next) {
	// res.status(200).send(`defaultLoginPage`)

	try {
		const e = new Error('test halaman login error')
		e.status = 500

		if (e) {
			throw e
		}
		

		res.status(200).send(`defaultLoginApi`)	
	} catch (err) {
		// next(err)
		handleError(err, req, res)
	}



}

async function defaultLoginApi(req, res, next) {
	const err = new Error('test halaman login error')
	
	if (err) {
		err.status = 500
		next(err)
	} else {
		res.status(200).send(`defaultLoginApi`)
	}


	
}

async function defaultGeneratorPage(req, res, next) {
	res.status(200).send(`defaultGeneratorPage`)

}

async function defaultGeneratorApi(req, res, next) {
	res.status(200).send(`defaultGeneratorApi`)
}

async function moduleLoader(req, res) {
	const modulename = req.params.modulename;
	const fullUrlWithHostHeader = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
	const __dirname = context.getRootDirectory()


	const fgta5jsDebugMode = req.app.locals.appConfig.appDebugMode
	const fgta5jsVersion = req.app.locals.appConfig.fgta5jsVersion
	const appDebugMode = req.app.locals.appConfig.appDebugMode


	const ejsPath = path.join(__dirname, '..', 'public', 'modules', modulename, `${modulename}.ejs`)
	const cssPath = path.join(__dirname, '..', 'public', 'modules', modulename, `${modulename}.css`);
	
	const mjsFileName = appDebugMode ? `${modulename}.mjs` : `${modulename}.min.mjs`
	const mjsPath = path.join(__dirname, '..', 'public', 'modules', modulename, mjsFileName);


	const htmlExtenderFile = `${modulename}-ext.html`
	const htmlExtender = `${modulename}/${htmlExtenderFile}`
	const htmlExtenderPath = path.join(__dirname, '..', 'public', 'modules', modulename, htmlExtenderFile)


	const cssExists = await helper.isFileExists(cssPath)
	const mjsExists = await helper.isFileExists(mjsPath);
	const htmlExtenderExists = await helper.isFileExists(htmlExtenderPath);

	const mjsPrerenderPath = path.join(__dirname, '..', 'public', 'modules', modulename, `${modulename}-prerender.mjs`);
	const mjsPrerenderExists = await helper.isFileExists(mjsPrerenderPath)


	const ejsModuleExist = await helper.isFileExists(ejsPath) 

	try {
		// load halaman html-nya
		if (!ejsModuleExist) {
			const err = new Error(`requested module '${modulename}' is not found`)
			err.status = 404
			throw err
		}
		
		const variables = {
			modulename,
			ejsPath,
			mjsPrerenderExists,
			cssExists,
			mjsExists,
			mjsFileName,
			htmlExtenderExists,
			htmlExtender,
			fgta5jsDebugMode,
			fgta5jsVersion: fgta5jsVersion==='' ? '' : `-${fgta5jsVersion}`,
			appDebugMode
		}

		const tplFilePath = path.join(context.getMyDirectory(), 'templates', 'application.ejs')
		const content = await helper.parseTemplate(tplFilePath, variables)

		res.status(200).send(content)
	} catch (err) {
		handleError(err, req, res)
	}
}

async function apiExecutor(req, res) {
	try {

	} catch (err) {
		handleError(err, req, res)
	}
}