import path from 'path';
import pgp from 'pg-promise'
import db from '../app-db.js'
import { workerData, parentPort } from 'worker_threads';
import { access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { createModuleRollup } from './createModuleRollup.js'
import { createModuleContext } from './createModuleContext.js'
import { createModuleExtenderMjs } from './createModuleExtenderMjs.js'
import { createModuleExtenderHtml } from './createModuleExtenderHtml.js'
import { createModuleEjs } from './createModuleEjs.js'
import { createModuleMjs } from './createModuleMjs.js'
import { createModuleHeaderListHtml } from './createModuleHeaderListHtml.js'
import { createModuleHeaderListMjs } from './createModuleHeaderListMjs.js'
import { createModuleHeaderEditHtml } from './createModuleHeaderEditHtml.js'
import { createModuleHeaderEditMjs } from './createModuleHeaderEditMjs.js'
import { createModuleDetilListHtml } from './createModuleDetilListHtml.js'
import { createModuleDetilListMjs } from './createModuleDetilListMjs.js'
import { createModuleDetilEditHtml } from './createModuleDetilEditHtml.js'
import { createModuleDetilEditMjs } from './createModuleDetilEditMjs.js'
import { createApiModule } from './createApiModule.js'
import { createApiExtenderModule } from './createApiExtenderModule.js'
import { createTable } from './createTable.js';





const { generator_id, jeda } = workerData;
const HEADER = 'header'
const DETIL = 'detil'
const LIST = 'list'
const EDIT = 'edit'


main(generator_id)


async function main(id) {
	try {
		const queryParams = {generator_id: id}
		const sql = 'select generator_data from core."generator" where generator_id = \${generator_id}'
		const data = await db.one(sql, queryParams);

		await generate(data.generator_data)
		
		
	} catch (err) {
		err.message = `Generator Worker: ${err.message}`
		throw err
	}
}

async function sleep(s) {
	if (s==0) {
		return
	}

	return new Promise(lanjut=>{
		setTimeout(()=>{
			lanjut()
		}, s*1000)	
	})
}

async function generate(data) {
	const context = {
		title: data.title,
		directory: data.directory,
		appname: data.appname,
		moduleName: data.name,
		entities: data.entities,
		postMessage: (info) => {
			parentPort.postMessage(info)
		}
	}

	const jedaWaktu = jeda ?? 0

	try {

		await prepareDirectory(context, {overwrite:true})
		await sleep(jedaWaktu)

		
		await createApiModule(context, {overwrite:true})
		await sleep(jedaWaktu)

		
		await createApiExtenderModule(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createTable(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleRollup(context, {overwrite:true})
		await sleep(jedaWaktu)



		await createModuleContext(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleExtenderHtml(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleExtenderMjs(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleEjs(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleMjs(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleHeaderListHtml(context, HEADER, LIST, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleHeaderListMjs(context, HEADER, LIST, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleHeaderEditHtml(context, HEADER, EDIT, {overwrite:true})
		await sleep(jedaWaktu)

		

		await createModuleHeaderEditMjs(context, HEADER, EDIT, {overwrite:true})
		await sleep(jedaWaktu)

		
		await createModuleDetilListHtml(context, DETIL, LIST, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleDetilListMjs(context, DETIL, LIST, {overwrite:true})
		await sleep(jedaWaktu)


		await createModuleDetilEditHtml(context, DETIL, EDIT, {overwrite:true})
		await sleep(jedaWaktu)
		
		await createModuleDetilEditMjs(context, DETIL, EDIT, {overwrite:true})
		await sleep(jedaWaktu)
			
		
		context.postMessage({message: `finish`, done:true})
	} catch (err) {
		throw err
	}
}

async function prepareDirectory(context) {
	const appname = context.appname
	const moduleName = context.moduleName
	const directory = context.directory


	try {

		context.postMessage({message: `preparing directory`})
		// await sleep(1)

		// cek jika directory project exists
		const projectDirExists = await directoryExists(directory)
		if (!projectDirExists) {
			throw new Error(`directory tujuan '${directory}' tidak ditemukan`)
		}

		const moduleDir = path.join(directory, 'public', 'modules', moduleName)
		const apiDir = path.join(directory, 'src', 'apis')
		const apiExtenderDir = path.join(apiDir, 'extenders')

		const moduleDirExists =  await directoryExists(moduleDir)
		if (!moduleDirExists) {
			// direktori modul tidak ditemukan, buat dulu
			context.postMessage({message: `creating new directory: '${moduleDir}`})
			await mkdir(moduleDir, {});
			// await sleep(1)
		}

		const apiDirExists =  await directoryExists(apiDir)
		if (!apiDirExists) {
			throw new Error(`directory tujuan '${apiDir}' tidak ditemukan`)
		}

		const apiExtenderDirExists =  await directoryExists(apiExtenderDir)
		if (!apiExtenderDirExists) {
			throw new Error(`directory tujuan '${apiExtenderDir}' tidak ditemukan`)
		}

		context.moduleDir = moduleDir
		context.apiDir = apiDir
		context.apiExtenderDir = apiExtenderDir
	} catch (err) {
		throw err
	}
}



async function directoryExists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

// async function main(generator_id) {
//   let t = 0;
 
//   let interval = setInterval(() => {
//     t++;
//     console.log(`progress of generate ${generator_id}: ${t}`)

// 	// if (t==5) {
// 	// 	throw new Error('ini error aja')
// 	// }


// 	if (t==20) {
// 		parentPort.postMessage({
// 			done: true,
// 			result: 'abc bac'
// 		})
// 		clearInterval(interval)
// 		interval = null
// 	} else {
// 		parentPort.postMessage({
// 			done: false,
// 			progress: t,
// 			message: `generate ${generator_id}: ${t}`
// 		})
// 	}

//   }, 1000);
// }