import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApiModule(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const title = context.title
	const targetFile = path.join(context.apiDir, `${moduleName}.js`)

	try {
		// cek dulu apakah file ada
		let fileExists = await isFileExist(targetFile)
		if (fileExists && !overwrite) {
			context.postMessage({message: `skip file: '${targetFile}`})
			return
		}

		// reporting progress to parent process
		context.postMessage({message: `generating file: '${targetFile}`})


		// get header information
		const entityHeader = context.entities['header']
		const headerTableName = entityHeader.table
		const headerPrimaryKey = entityHeader.pk
		const headerSearchMap = createSearchMap(entityHeader.Search, entityHeader.Items, headerTableName)
		const autoid = entityHeader.identifierMethod=='manual' ? false : true

		const headerFieldsLookup = createLookup(entityHeader.Items)

		// get detil information
		for (let entityName in context.entities) {
			if (entityName=='header') {
				continue
			}

			const entity = context.entities[entityName]
		}


		const variables = {
			title: title,
			moduleName: moduleName,
			autoid,
			headerTableName,
			headerPrimaryKey,
			headerSearchMap,
			headerFieldsLookup
		}
		
		
		const tplFilePath = path.join(__dirname, 'templates', 'api-module.js.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
				
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}

}


function createSearchMap(searchdata, items, tablename) {
	// searchtext: `user_fullname ILIKE '%' || \${searchtext} || '%' OR user_id=try_cast_bigint(\${searchtext}, 0)`,
	// searchgroup: `group_id = \${searchgroup}`,
	// user_isdisabled: `user_isdisabled = \${user_isdisabled}`
	const searchMap = []
	for (let searchname in searchdata) {
		const search = searchdata[searchname]
		const searchfield = parseSearchField(search.fields)
		
		// cek tipe data dari masing-masing search field
		const params = []
		for (let fieldname in searchfield) {
			const field = items[fieldname]
			const search = searchfield[fieldname]
			if (field===undefined) {
				throw new Error(`parameter search '${searchname}' tidak mengacu pada design tabel '${tablename}' `)
			}

			const datatype = field.data_type
			const hasPercent = search.hasPercent

			let searchToken
			if (datatype=='int') {
				searchToken = `${fieldname}=try_cast_int(\\\${${searchname}}, 0)`
			} else if (datatype=='bigint') {
				searchToken = `${fieldname}=try_cast_bigint(\\\${${searchname}}, 0)`
			} else {
				if (hasPercent) {
					searchToken = `${fieldname} ILIKE '%' || \\\${${searchname}} || '%'`
				} else {
					searchToken = `${fieldname} = \\\${${searchname}}`
				}
			}
			params.push(searchToken)
		}
		const searchcriteria = params.join(' OR ')
		
		searchMap.push({
			name: searchname,
			data: searchcriteria
		})
	}
	return searchMap
}

function parseSearchField(rawFields) {
	const parsedFields = rawFields
		.split(',')
		.map(field => field.trim())
		.reduce((acc, field) => {
			const hasPercent = field.startsWith('%');
			const name = hasPercent ? field.slice(1) : field;

			acc[name] = {
				name,
				hasPercent
			};

			return acc;
		}, {}
	);

	return parsedFields
}

function createLookup(items) {
	const lookup = []
	for (let fieldname in items) {
		const item = items[fieldname]
		if (item.component=='Combobox') {
			const {bindingValue, bindingText, bindingDisplay, table} = item.Reference
			lookup.push({
				fieldname, bindingValue, bindingText, bindingDisplay, table
			})
		}
	}
	return lookup
}