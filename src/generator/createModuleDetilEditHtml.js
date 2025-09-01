import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleDetilEditHtml(context, sectionName='detil', sectionPart='edit', options) {
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

		// sementara skip detil
		return

		// reporting progress to parent process
		context.postMessage({message: `generating file: '${targetFile}`})


		// start geneate program code
		let sections = []
		for (var entityName in context.entities) {
			// console.log(context.entities[entityName])
			sections.push(getSectionData(moduleName, entityName, context.entities[entityName], 'list'))
			sections.push(getSectionData(moduleName, entityName, context.entities[entityName], 'edit'))
		}

		const variables = {
			title: title,
			moduleName: moduleName,
			sections: sections
		}
		
		
		const tplFilePath = path.join(__dirname, 'templates', 'moduleDetilEdit.html.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
				
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}

}