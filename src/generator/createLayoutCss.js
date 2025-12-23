import { kebabToCamel, isFileExist, getSectionData, createAdditionalAttributes } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createLayoutCss(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName

	try {
		for (let entityName in context.entities) {
			const sectionName = entityName
			const sectionPart = 'edit'
			const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
			const targetFile = path.join(context.moduleDir, `${modulePart}.layout.css`)

			// cek dulu apakah file ada 
			const fileExists = await isFileExist(targetFile)        
			if (fileExists && !overwrite) {
				context.postMessage({message: `skip file: '${targetFile}`})
				return
			}
			context.postMessage({message: `generating file: '${targetFile}`})  // reporting progress to parent process


			const entityData = context.entities[entityName]
			if (!entityData.formGridLayout) {
				continue   // jika tidak menggunakan formGridLautout tidak perlu generate css layout
			}



			const fields = []
			let index = 0
			for (var fieldName in entityData.Items) {
				const item = entityData.Items[fieldName]
				index++

				if (!item.showInForm) {
					continue
				}


				const component = item.component
				const fieldname = item.data_fieldname
				const elementId = `${modulePart}-${item.input_name}`
				const dposrow = item.input_dposrow??'auto'
				const dposrowspan = item.input_dposrowspan??''
				const dposcol = item.input_dposcol??'1'
				const dposcolspan = item.input_dposcolspan??''
				const dposstyle = item.input_dposstyle??''
								


				fields.push({  
					elementId,
					dposrow,
					dposcol,
					dposrowspan: dposrowspan.trim()!='' ? ` / span ${dposrowspan}` : '',
					dposcolspan: dposcolspan.trim()!='' ? ` / span ${dposcolspan}` : '',
					dposstyle
				})

			
			}


			const variables = {
				moduleName: moduleName,
				modulePart: modulePart,
				fields: fields,
			}

			console.log(variables)

			const tplFilePath = path.join(__dirname, 'templates', 'layout.css.ejs')
			const template = await fs.readFile(tplFilePath, 'utf-8');
			const content = ejs.render(template, variables)
					
			await fs.writeFile(targetFile, content, 'utf8');
		}
	} catch (err) {
		throw err
	}

}