import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import ejs from 'ejs'
import path from 'path'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleHeaderListHtml(context, sectionName='header', sectionPart='list', options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const title = context.title
	const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
	const targetFile = path.join(context.moduleDir, `${modulePart}.html`)

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
		const sectionData = getSectionData(moduleName, entityName, entityData, 'list')
		
		const fields = []
		for (var fieldName in entityData.Items) {
			const item = entityData.Items[fieldName]

			if (!item.showInGrid) {
				continue
			}

			const component = item.component
			const dataName = item.name
			const binding = item.data_fieldname
			const label = item.input_label
			const {bindingValue, bindingText, bindingDisplay, table} = item.Reference
			
			// additional attributes
			const attrs = []
			if (item.grid_formatter.trim()!='') {
				attrs.push(`formatter="${item.grid_formatter}"`)
			}
			
			if (item.grid_css.trim()!='') {
				attrs.push(`class="${item.grid_css}"`)
			}

			if (item.grid_inlinestyle.trim()!='') {
				attrs.push(`style="${item.grid_inlinestyle}"`)
			}

			if (item.grid_sorting) {
				attrs.push(`sorting="true"`)
			}

			let additionalAttributes = attrs.join(' ')


			// masukkan ke fields
			fields.push({  
				component,
				dataName: bindingDisplay!=null ? bindingDisplay : dataName, 
				binding: bindingDisplay!=null ? bindingDisplay : binding,
				label,
				additionalAttributes
			})
		}

		const variables = {
			title: title,
			moduleName: moduleName,
			modulePart: modulePart,
			moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
			section: sectionData,
			fields: fields
		}
		
		
		const tplFilePath = path.join(__dirname, 'templates', 'moduleHeaderList.html.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
				
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}

}