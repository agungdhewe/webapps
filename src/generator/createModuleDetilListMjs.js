import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleDetilListMjs(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName

	const sectionPart = 'list'

	try {

		const headerEntityData = context.entities['header']
		const headerModulePartEdit = kebabToCamel(`${moduleName}-header-edit`)
		const headerPrimaryKey = headerEntityData.pk

		for (let entityName in context.entities) {
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


			// start geneate program code	
			const entityData = context.entities[entityName]
			const sectionData = getSectionData(moduleName, entityName, entityData, 'edit')
			const title = entityData.title


			const variables = {
				title,
				modulePart,
				moduleName,
				sectionName,
				headerModulePartEdit,
				headerPrimaryKey,
				moduleEdit: kebabToCamel(`${moduleName}-${sectionName}-edit`),

			}

			const tplFilePath = path.join(__dirname, 'templates', 'moduleDetilList.mjs.ejs')
			const template = await fs.readFile(tplFilePath, 'utf-8');
			const content = ejs.render(template, variables)
					
			await fs.writeFile(targetFile, content, 'utf8');
		}
	} catch (err) {
		throw err
	}

}