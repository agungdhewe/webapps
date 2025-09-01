import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import * as ddl from './ddl.js'
import path from 'path'
import fs from 'fs/promises'
import pgp from 'pg-promise'
import db from '../app-db.js'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createTable(context, options) {
	const skipGenerate = options.skipGenerate===true
	const moduleName = context.moduleName
	const title = context.title
	const targetFile = path.join(context.moduleDir, `${moduleName}.sql`)
	

	try {
		if (skipGenerate) {
			context.postMessage({message: `skip generate table(s)`})
			return
		}

		// reporting progress to parent process
		context.postMessage({message: `generating file: '${targetFile}`})


		// start geneate program code		
		let sections = []
		for (var entityName in context.entities) {
			const entity = context.entities[entityName]
			const {table, descr, pk, identifierMethod} = entity
			const pkData = entity.Items[pk]
			const {schema, tablename} = ddl.parseTableName(table)
			const {data_fieldname, data_type, data_length, description} = pkData

			const scriptContent = []

			scriptContent.push(`-- ${moduleName}.sql`)
			scriptContent.push("\n")

			// Buat Table dengan field hanya untuk primary key
			{
				const sql =	await ddl.createTable(schema, tablename, descr, {
					fieldname: data_fieldname,
					datatype: data_type,
					length: data_length,
					identifierMethod: identifierMethod
				})
				scriptContent.push(sql)
			}


			// Buat Fields
			{
				const recordColumns = createRecordColumns()
				const Items = {...entity.Items, ...recordColumns}

				for (var fieldname in Items) {
					if (fieldname==pk) {
						continue
					}

					const field = Items[fieldname]
					const {data_fieldname, data_type, data_length, data_precision, data_allownull, data_defaultvalue, description} = field

					const sql =	await ddl.createField(schema, tablename, {
						fieldname: data_fieldname, 
						datatype: data_type, 
						length: data_length, 
						precision: data_precision, 
						allownull: data_allownull, 
						defaultvalue: data_defaultvalue, 
						description: description
					})
					scriptContent.push(sql)
				}

			}

			// buat foreign key
			scriptContent.push("\n")
			{
				const foreignKeys = Object.entries(entity.Items)
					.filter(([_, value]) => value.Reference.table !== null && value.Reference.table !== '')
					.reduce((acc, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {})

				
				const sql =	await ddl.createFereignKey(schema, tablename, foreignKeys)	
				scriptContent.push(sql)

			}



			// buat unique index
			scriptContent.push("\n")
			{
				const sql = await ddl.createUniqueIndex(schema, tablename, entity.Uniques)
				scriptContent.push(sql)
			}	

			
			let content = scriptContent.join("\n")
			await fs.writeFile(targetFile, content, 'utf8');
		}
	} catch (err) {
		throw err
	}

}


function createRecordColumns() {
	const records = {
		_createby: {data_fieldname: '_createby', data_type: 'bigint', data_allownull: false, description: 'user yang pertama kali membuat record ini'},
		_createdate: {data_fieldname: '_createdate', data_type: 'timestamp', data_allownull: false, description: 'waktu record dibuat pertama kali'},
		_modifyby: {data_fieldname: '_modifyby', data_type: 'bigint', data_allownull: true, description: 'user yang terakhir modifikasi record ini'},
		_modifydate: {data_fieldname: '_modifydate', data_type: 'timestamp', data_allownull: true, description: 'waktu terakhir record dimodifikasi'}
	}

	return records
}


