import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleContext(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const targetFile = path.join(context.moduleDir, `${moduleName}-context.mjs`)
	
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
		let sections = []
		for (var entityName in context.entities) {
			sections.push(getSectionData(moduleName, entityName, context.entities[entityName], 'list'))
			sections.push(getSectionData(moduleName, entityName, context.entities[entityName], 'edit'))
		}

		const variables = {
			moduleName: moduleName,
			sections: sections
		}

		const tplFilePath = path.join(__dirname, 'templates', 'module-context.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
		
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}
}