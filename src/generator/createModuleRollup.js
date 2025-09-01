import { isFileExist } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleRollup(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	const targetFile = path.join(context.moduleDir, `__rollup.${moduleName}.js`)
	

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
		const variables = {
			moduleName: moduleName
		}
		
		const tplFilePath = path.join(__dirname, 'templates', '__rollup-module.ejs')
		const template = await fs.readFile(tplFilePath, 'utf-8');
		const content = ejs.render(template, variables)
		
		await fs.writeFile(targetFile, content, 'utf8');
	} catch (err) {
		throw err
	}
}