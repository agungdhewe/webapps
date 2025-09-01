import { kebabToCamel, isFileExist, getSectionData, createAdditionalAttributes } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleHeaderEditHtml(context, sectionName='header', sectionPart='edit', options) {
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
		const sectionData = getSectionData(moduleName, entityName, entityData, 'edit')
		const primaryKeyFieldData = entityData.Items[sectionData.primaryKey] 
		const primaryKeyName = primaryKeyFieldData.input_name
		const primaryKeyElementId = `${modulePart}-${primaryKeyName}`

		const autoid = entityData.identifierMethod=='manual' ? 'false' : 'true'

		const fields = []
		for (var fieldName in entityData.Items) {
			const item = entityData.Items[fieldName]

			// if (item.data_fieldname=='grouptype_id') {
			// 	console.log(item)
			// }

			if (!item.showInForm) {
				continue
			}

			const component = item.component
			const fieldname = item.data_fieldname
			const elementId = `${modulePart}-${item.input_name}`
			const placeholder = item.input_placeholder
			const label = item.input_label
			const binding = item.data_fieldname
			const additionalAttributes = createAdditionalAttributes(item)
			const cssContainer = item.input_containercss.trim() == '' ? 'input-field' : `input-field ${item.input_containercss.trim()}` 

			fields.push({  
				component,
				cssContainer,
				fieldname,
				elementId,
				placeholder,
				label,
				binding,
				additionalAttributes
			})

		}

		const variables = {
			title: title,
			moduleName: moduleName,
			modulePart: modulePart,
			moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
			section: sectionData,
			autoid,
			primaryKeyElementId: primaryKeyElementId,
			fields: fields
		}
		
		
		const tplFilePath = path.join(__dirname, 'templates', 'moduleHeaderEdit.html.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
				
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}

}