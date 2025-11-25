import path from 'path';
import pgp from 'pg-promise'
import db from '../db.js'
import { workerData, parentPort } from 'worker_threads';
import { access, mkdir } from 'fs/promises';
import { constants } from 'fs';

import { isFileExist } from './helper.js'

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
import { createInfoAboutExtender } from './createInfoAboutExtender.js';
import { createInfoLogs } from './createInfoLogs.js';
import { createInfoRecordExtender } from './createInfoRecordExtender.js';
import { createIcon } from './createIcon.js'
import { createProgramData } from './createProgramData.js'



const { generator_id, user_id, user_name, ipaddress, jeda } = workerData;


main(generator_id)


async function main(id) {
	try {
		const queryParams = {generator_id: id}
		const sql = 'select generator_data from core."generator" where generator_id = \${generator_id}'
		const data = await db.one(sql, queryParams);


		// cek dahulu apakah directory tujuan benar
		// console.log(data)


		await generate(id, data.generator_data)
		
		
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

async function generate(id, data) {

	const now = new Date();

	const options = {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	};

	const formattedTime = now.toLocaleString('en-GB', options).replace(',', '');


	const context = {
		id:id,
		user_id: user_id,
		user_name: user_name, 
		ipaddress: ipaddress,
		title: data.title,
		descr: data.description,
		directory: data.directory,
		appname: data.appname,
		moduleName: data.name,
		entities: data.entities,
		actions: data.actions,
		icon: data.icon,
		timeGenerated: formattedTime,
		postMessage: (info) => {
			parentPort.postMessage(info)
		}
	}

	const jedaWaktu = jeda ?? 0




	// tambahkan referensi ke entity detil
	const entityHeader = context.entities['header']
	const headerPkFieldName = entityHeader.pk
	const headerItems = entityHeader.Items
	for (var entityName in context.entities) {
		// tambahkan jika bukan header
		if (entityName!='header') {
			const headerPK = structuredClone(headerItems[headerPkFieldName])
			headerPK.Reference.pk = entityHeader.pk
			headerPK.Reference.table = entityHeader.table
			headerPK.Reference.bindingValue = entityHeader.pk
			headerPK.input_disabled = true
			context.entities[entityName].Items[entityHeader.pk] = headerPK
		}
	}


	try {

		await checkEntitiy(context)
		// process.exit(0)


		await prepareDirectory(context, {overwrite:true})
		await sleep(jedaWaktu)


		
		const iconFileName = await createIcon(context, {overwrite:true})

		await createProgramData(context, {iconFileName})
	
		await createTable(context, {overwrite:true})
		await sleep(jedaWaktu)
		

		
		await createModuleRollup(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleContext(context, {overwrite:true})
		await sleep(jedaWaktu)

		

		await createModuleEjs(context, {overwrite:true})
		await sleep(jedaWaktu)

		
		await createModuleMjs(context, {overwrite:true, iconFileName})
		await sleep(jedaWaktu)



		// Header
		await createModuleHeaderListHtml(context, {overwrite:true})
		await sleep(jedaWaktu)
		

		await createModuleHeaderListMjs(context, {overwrite:true})
		await sleep(jedaWaktu)

		
		await createModuleHeaderEditHtml(context,  {overwrite:true})
		await sleep(jedaWaktu)

		
		await createModuleHeaderEditMjs(context, {overwrite:true})
		await sleep(jedaWaktu)
	

		
		// Detils
		await createModuleDetilListHtml(context, {overwrite:true})
		await sleep(jedaWaktu)

		await createModuleDetilListMjs(context, {overwrite:true})
		await sleep(jedaWaktu)


		await createModuleDetilEditHtml(context, {overwrite:true})
		await sleep(jedaWaktu)
		
		await createModuleDetilEditMjs(context, {overwrite:true})
		await sleep(jedaWaktu)
		

		await createInfoLogs(context, {overwrite:true})
		await sleep(jedaWaktu)


		// Extender
		await createModuleExtenderHtml(context, {overwrite:false})
		await sleep(jedaWaktu)

		await createModuleExtenderMjs(context, {overwrite:false})
		await sleep(jedaWaktu)

		await createInfoAboutExtender(context, {overwrite:false})
		await sleep(jedaWaktu)

		await createInfoRecordExtender(context, {overwrite:false})
		await sleep(jedaWaktu)

		// Api
		await createApiModule(context, {overwrite:true})
		// await sleep(jedaWaktu)

		await createApiExtenderModule(context, {overwrite:false})
		// await sleep(jedaWaktu)


		// Selesai
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


		// cek apakah sudah di lock
		const lockFile = path.join(moduleDir, `${moduleName}.lock`)
		var fileExists = await isFileExist(lockFile)
		if (fileExists) {
			console.log("\n\n\x1b[1m\x1b[31mERROR\x1b[0m")
			console.log('Module sudah di lock, tidak bisa digenerate ulang')
			process.exit(1)
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

async function checkEntitiy(context) {
	const apps = []
	try {
		const sql = "select * from core.apps"
		const rows = await db.any(sql)
		for (let row of rows) {
			apps[row.apps_id] = row
		}
	} catch (err) {
		throw err
	}


	// cek appname
	if (apps[context.appname]==null) {
		throw new Error(`App Name: '${context.appname}' tidak valid. Cek di data apps`)
	}


	// process.exit(1)

	for (let entityName in context.entities) {
		const entity = context.entities[entityName]
		const entity_table = entity.table
		const entity_pk = entity.pk
		const Items = entity.Items
		
		let pkExists = false	

		for (let fieldName in Items) {
			const item = Items[fieldName]
			const component = item.component

			// Cek Primary Key
			if (fieldName==entity_pk) {
				pkExists = true
				if (!item.showInForm) {
					throw new Error(`Primary key '${fieldName}' pada entity '${entityName}' harus di embed di form. Apabila ingin menyembunyakannya, gunakan 'hidden' di Container CSS `)
				}
			}

			// Cek combobox
			if (component=='Combobox') {
				// cek apakah konfig udah bener
				const reference = item.Reference
				const table = reference.table.trim()
				const pk = reference.pk.trim()
				const bindingValue = reference.bindingValue.trim()
				const bindingText = reference.bindingText.trim()
				const loaderApiModule = reference.loaderApiModule.trim()
				const loaderApiPath = reference.loaderApiPath.trim()

				if(table=='') {
					throw new Error(`table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}

				if(pk=='') {
					throw new Error(`PK untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}
				
				if(bindingValue=='') {
					throw new Error(`binding value untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}

				if(bindingText=='') {
					throw new Error(`binding value untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}

				if(loaderApiModule=='') {
					throw new Error(`loader API Name untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}

				if (apps[loaderApiModule]==null) {
					if (loaderApiModule!='/') {
						throw new Error(`loader API Name: '${loaderApiModule}' untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak valid. Cek di data apps`)
					}
				}

				if(loaderApiPath=='') {
					throw new Error(`loader API path untuk table reference Combobox '${fieldName}' di entity '${entityName}' tidak boleh kosong`)
				}
			}
		}

		if (!pkExists) {
			throw new Error(`Primary key pada entity '${entityName}' belum didefinisikan`)
		}


	}
}