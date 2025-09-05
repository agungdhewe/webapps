import fs from 'fs/promises';
import * as path from 'node:path';
import ejs from 'ejs'
import context from './context.js'


export function kebabToCamel(str) {
  return str
    .split('-')
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}


export async function importModule(modulename, cached=true) {
	// jika mode debug, 
	// load api akan selalu dilakukan saat request (tanpa caching)

	if (cached) {
		return (await import(`./apis/${modulename}.js`)).default;
	} else {
		const fullPath = new URL(`./apis/${modulename}.js`, import.meta.url).pathname;
		const mtime = (await fs.stat(fullPath)).mtimeMs;
		const freshUrl = `${fullPath}?v=${mtime}`;
		const module = await import(freshUrl);

		if (module.default===undefined) {
			throw new Error(`modul api '${modulename}' tidak mempunyai default class untuk import`)
		}

		return module.default;	
	}
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


export function createDefaultEjsVariable(req) {
	const appName = req.app.locals.appConfig.appName || ''
	const moduleName = req.params.modulename
	const libDebug = path.join(context.getMyDirectory(), 'templates', '_lib_debug.ejs')
	const libProduction = path.join(context.getMyDirectory(), 'templates', '_lib_production.ejs')
	const fgta5jsDebugMode = req.app.locals.appConfig.appDebugMode
	const fgta5jsVersion = req.app.locals.appConfig.fgta5jsVersion
	const appDebugMode = req.app.locals.appConfig.appDebugMode

	const variables = {
		appName,
		moduleName,
		libDebug,
		libProduction,
		fgta5jsDebugMode,
		fgta5jsVersion,
		appDebugMode
	}

	return variables
}