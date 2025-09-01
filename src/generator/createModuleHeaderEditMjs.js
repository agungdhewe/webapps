import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleHeaderEditMjs(context, sectionName='header', sectionPart='edit', options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const title = context.title
	const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
	const targetFile = path.join(context.moduleDir, `${modulePart}.mjs`)

	try {
		// cek dulu apakah file ada
		var fileExists = await isFileExist(targetFile)
		if (fileExists && !overwrite) {
			context.postMessage({message: `skip file: '${targetFile}`})
			return
		}

		// reporting progress to parent process
		context.postMessage({message: `generating file: '${targetFile}`})


		// start geneate program code
		const entityName = sectionName
		const entityData = context.entities[entityName]

		const fields = []
		const fieldHandles = []
		for (var fieldName in entityData.Items) {
			const item = entityData.Items[fieldName]

			if (!item.showInForm) {
				continue
			}


			const component = item.component
			const fieldname = item.data_fieldname
			const inputname = item.input_name
			const elementId = `${modulePart}-${item.input_name}`


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


			fields.push({  
				component,
				fieldname,
				inputname,
				elementId
			})
		}



		const variables = {
			title: title,
			modulePart: modulePart,
			moduleName: moduleName,
			moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
			moduleList: kebabToCamel(`${moduleName}-${sectionName}-list`),
			fields: fields,
			fieldHandles
		}

		
		
		const tplFilePath = path.join(__dirname, 'templates', 'moduleHeaderEdit.mjs.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
				
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}

}