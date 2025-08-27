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
import { defaultLoginPage } from './routers/defaultLoginPage.js'
import { defaultLoginApi } from './routers/defaultLoginApi.js'
import { generatorPage } from './routers/generatorPage.js'
import { generatorAsset } from './routers/generatorPage.js'
import { generatorApi } from './routers/generatorApi.js'
import { modulePage } from './routers/modulePage.js'
import { moduleApi } from './routers/moduleApi.js'


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


export function createBasicRouter() {
	const router = ExpressServer.Router({ mergeParams: true });

	router.get('/', defaultRootIndex)
	router.post('/upload', fileUploadApi)
	
	router.get('/login', defaultLoginPage)
	router.post('/login/:method', defaultLoginApi)
	
	router.get('/generator', generatorPage)
	router.get('/generator/:requestedAsset', generatorAsset)
	router.post('/generator/:method', generatorApi)
	
	router.get('/:modulename', modulePage)
	router.post('/:modulename/:method', moduleApi)

	return router
}







