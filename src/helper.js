import fs from 'fs/promises';
import * as path from 'node:path';
import ejs from 'ejs'



export function kebabToCamel(str) {
  return str
    .split('-')
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}


export async function isFileExists(filepath) {
	try {
		await fs.access(filepath);
		return true
	} catch (err) {
		return false
	}
}

export async function parseTemplate(tplFilePath, variables={}) {
	const template =  await fs.readFile(tplFilePath, 'utf-8');
	const content = ejs.render(template, variables)
	return content
}