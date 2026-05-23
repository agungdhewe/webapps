import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createDefData(context, data, options) {
	const version = context.version
	const versionText = context.versionText

	const overwrite = options.overwrite === true
	const moduleName = context.moduleName
	const targetFile = path.join(context.moduleDir, `${moduleName}.gen.json`)


	try {
		const content = JSON.stringify(data)
		await fs.writeFile(targetFile, content, 'utf8')
	} catch (err) {
		throw err
	}

}