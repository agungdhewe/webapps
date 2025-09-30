import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleDetilEditMjs(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const title = context.title
	const sectionPart = 'edit'

	try {

		const headerEntityData = context.entities['header']
		const headerModulePartEdit = kebabToCamel(`${moduleName}-header-edit`)
		const headerPrimaryKey = headerEntityData.pk


		for (let entityName in context.entities) {
			const entityData = context.entities[entityName]

			// process selain header
			if (entityName=='header') {
				continue
			}

			const sectionName = entityName
			const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
			const targetFile = path.join(context.moduleDir, `${modulePart}.mjs`)

			// cek dulu apakah file ada
			var fileExists = await isFileExist(targetFile)
			if (fileExists && !overwrite) {
				context.postMessage({message: `skip file: '${targetFile}`})
				return
			}

			// reporting progress to parent process
			context.postMessage({message: `generating file: '${targetFile}`})


			const tablename = entityData.table

			const fields = []
			const fieldHandles = []
			const defaultInits = []
			for (var fieldName in entityData.Items) {
				const item = entityData.Items[fieldName]

				if (!item.showInForm) {
					continue
				}


				const component = item.component
				const fieldname = item.data_fieldname
				const inputname = item.input_name
				const elementId = `${modulePart}-${item.input_name}`


				// setup handles
				const handles = []
				for (let eventname in item.Handle) {
					let createhandle = item.Handle[eventname]
					if (createhandle) {
						if (eventname=='selecting' && component=='Combobox') {
							handles.push({
								eventname,
								appId: item.Reference.loaderApiModule,
								path: item.Reference.loaderApiPath,
								field_value: item.Reference.bindingValue,
								field_text: item.Reference.bindingText, 
							})
						} else {
							handles.push({eventname})
						}
					}
				}

				if (handles.length>0) {
					fieldHandles.push({component, inputname, handles})
				}


				// setup default values
				let setdefault
				if (item.data_defaultvalue != '') {
					if (item.component=='Datepicker' || item.component=='Timepicker') {
						setdefault = `${item.name }: new Date()`
					} else if (item.component=='Numberbox') {
						setdefault = `${item.name }: ${item.data_defaultvalue}`
					} else if (item.component=='Checkbox') {
						if (item.data_defaultvalue==='true' || item.data_defaultvalue==='checked' || item.data_defaultvalue==='1') {
							setdefault = `${item.name }: true`
						}
					} else {
						setdefault = `${item.name }: '${item.data_defaultvalue}'`
					}
				}

				if (setdefault!=null) {
					defaultInits.push(setdefault)
				}





				// add to field config data	
				fields.push({  
					component,
					fieldname,
					inputname,
					elementId
				})
			}			


			const variables = {
				title,
				tablename,
				modulePart,
				moduleName,
				sectionName,
				headerPrimaryKey,
				moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
				moduleList: kebabToCamel(`${moduleName}-${sectionName}-list`),
				fields,
				fieldHandles,
				defaultInits,
			}

			const tplFilePath = path.join(__dirname, 'templates', 'moduleDetilEdit.mjs.ejs')
			const template = await fs.readFile(tplFilePath, 'utf-8');
			const content = ejs.render(template, variables)
					
			await fs.writeFile(targetFile, content, 'utf8');
		}
	} catch (err) {
		throw err
	}

}