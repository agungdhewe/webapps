import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleDetilListHtml(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const title = context.title
	const sectionPart = 'list'
	

	try {
		
		for (let entityName in context.entities) {
			// process selain header
			if (entityName=='header') {
				continue
			}

			const sectionName = entityName
			const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
			const targetFile = path.join(context.moduleDir, `${modulePart}.html`)
			
			// cek dulu apakah file ada
			var fileExists = await isFileExist(targetFile)         
			if (fileExists && !overwrite) {
				context.postMessage({message: `skip file: '${targetFile}`})
				return
			}
			context.postMessage({message: `generating file: '${targetFile}`})  // reporting progress to parent process

			// start geneate program code
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
					attrs.push(`style='${item.grid_inlinestyle}'`)
				}

				if (item.grid_sorting) {
					attrs.push(`sorting="true"`)
				}

				let additionalAttributes = attrs.join(' ')



				let columnDataName = dataName
				let columnDataBinding = binding

				if (component=='Combobox') {
					if (bindingDisplay!='' && bindingDisplay!=null) {
						columnDataName = bindingDisplay
						columnDataBinding = bindingDisplay
					} else {
						columnDataName = bindingText
						columnDataBinding = bindingText
					}
				}


				// masukkan ke fields
				fields.push({  
					component,
					dataName: columnDataName, //bindingDisplay!=null ? bindingDisplay : dataName, 
					binding: columnDataBinding, //bindingDisplay!=null ? bindingDisplay : binding,
					label,
					additionalAttributes
				})
			}


			const variables = {
				timeGenerated: context.timeGenerated,
				title: title,
				moduleName: moduleName,
				modulePart: modulePart,
				moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
				section: sectionData,
				fields: fields
			}

		
			const tplFilePath = path.join(__dirname, 'templates', 'moduleDetilList.html.ejs')
			const template = await fs.readFile(tplFilePath, 'utf-8');
			const content = ejs.render(template, variables)
					
			await fs.writeFile(targetFile, content, 'utf8');
		
		}
	} catch (err) {
		throw err
	}

}