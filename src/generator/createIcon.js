import { isFileExist } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createIcon(context, options) {
	const rawData = context.icon

	if (rawData=='' || rawData==null) {
		return
	}

	const overwrite = options.overwrite===true
	const moduleName = context.moduleName

	try {

		const ext = detectImageType(rawData);
		const targetFile = path.join(context.moduleDir, `${moduleName}.${ext}`)
		const base64 = getBase64data(rawData, ext)

		if (base64==null) {
			throw new Error('data icon tidak di support, gunakan svg atau png')
		}

		const svgBuffer = Buffer.from(base64, 'base64');
		await fs.writeFile(targetFile, svgBuffer, 'utf8');

		return `${moduleName}.${ext}`
	} catch (err) {
		throw err
	}
}


function detectImageType(dataUrl) {
  const match = dataUrl.match(/^url\("data:(image\/[a-zA-Z0-9\+\.-]+);base64,/);
  if (!match) return null;
  const mime = match[1];

  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/svg+xml') return 'svg';
  return mime; // fallback: raw MIME
}


function getBase64data(rawData, ext) {
	if (ext=='svg') {
		return rawData.replace(/^url\("data:image\/svg\+xml;base64,/, '').replace(/"\)$/, '');
	} else if (ext=='png') {
		return rawData.replace(/^url\("data:image\/png;base64,/, '').replace(/"\)$/, '');
	} else if (ext=='jpg') {
		return rawData.replace(/^url\("data:image\/jpeg;base64,/, '').replace(/"\)$/, '');
	} else {
		return null
	}
}