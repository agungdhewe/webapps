import ExpressServer from 'express'
import multer from 'multer';
import fs from 'fs/promises';
import * as path from 'node:path'
import * as http from 'node:http' 
import * as helper from './helper.js'
import { fileURLToPath } from 'node:url';
import context from './context.js'

import { defaultRootIndex } from './routers/defaultRootIndex.js'
import { handleModuleNotfound } from './routers/handleModuleNotfound.js'
import { handleError } from './routers/handleError.js'
import { fileUploadApi } from './routers/fileUploadApi.js'
import { publicDownloadHandler, privateDownloadHandler } from './routers/downloadHandler.js'
import { defaultLoginPage } from './routers/defaultLoginPage.js'
import { defaultLoginAsset } from './routers/defaultLoginAsset.js'
import { defaultLoginApi } from './routers/defaultLoginApi.js'
import { generatorPage } from './routers/generatorPage.js'
import { generatorAsset } from './routers/generatorAsset.js'
import { generatorApi } from './routers/generatorApi.js'
import { modulePage } from './routers/modulePage.js'
import { moduleApi } from './routers/moduleApi.js'


export default {
	createBasicRouter: () => { return createBasicRouter() }
} 


export function uploader(req, res, next) {
	if (req.is('multipart/form-data')) {
		const upload = multer();
		upload.any()(req, res, next);
	} else {
		next();
	}
}



export function createBasicRouter() {
	const router = ExpressServer.Router({ mergeParams: true });

	// index
	router.get('/', defaultRootIndex)
	
	
	// upload
	router.post('/upload', fileUploadApi)
	
	// download
	router.get('/download', publicDownloadHandler)
	router.post('/download', privateDownloadHandler)


	// login
	router.get('/login', defaultLoginPage)
	router.get('/login/:requestedAsset', defaultLoginAsset)
	router.post('/login/:method', defaultLoginApi)
	
	// generator
	router.get('/generator', generatorPage)
	router.get('/generator/:requestedAsset', generatorAsset)
	router.post('/generator/:method', generatorApi)

	
	// debug
	// router.get('/debug/:modulename', modulePage)
	// router.post('/debug/:modulename/:method', moduleApi)


	// modul
	router.get('/:modulename', modulePage)
	router.post('/:modulename/:method', moduleApi)	

	return router
}







