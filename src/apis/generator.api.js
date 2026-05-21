import pgp from 'pg-promise'

import * as path from 'path'
import db from '../db.js'
import Api from '../api.js'
import * as helper from '../helper.js'
import { runDetachedWorker } from '../workermanager.js'
import context from '../context.js'
import sqlUtil from '@agung_dhewe/pgsqlc'
import { readdir, access, readFile, writeFile, mkdir } from 'fs/promises';


import jwt from 'jsonwebtoken';

const MINUTES = 60 * 1000

const moduleName = 'generator'
const generateTimeoutMs = 5 * MINUTES

const ModuleDbContract = {
	apps: {
		table: 'core."apps"'
	},
	generator: {
		table: 'core.generator'
	}
}

// api: account
export default class extends Api {
	constructor(req, res, next) {
		super(req, res, next);
		Api.cekLogin(req)

	}


	// dipanggil dengan model snake syntax
	// contoh: header-list
	//         header-open-data
	async init(body) { return await generator_init(this, body) }
	async list(body) { return await generator_list(this, body) }
	async open(body) { return await generator_open(this, body) }
	async save(body) { return await generator_save(this, body) }
	async generate(body) { return await generator_generate(this, body) }

}


async function generator_init(self, body) {
	const req = self.req

	// set sid untuk session ini, diperlukan ini agar session aktif
	req.session.sid = req.sessionID


	try {
		// ambil data app dari database
		const sql = `select apps_id, apps_url, apps_name, apps_directory from ${ModuleDbContract.apps.table}`
		const result = await db.any(sql)

		const appsUrls = {}
		for (let row of result) {
			appsUrls[row.apps_id] = {
				url: row.apps_url,
				directory: row.apps_directory,
				name: row.apps_name
			}
		}

		return {
			userId: req.session.user.userId,
			userName: req.session.user.userName,
			userFullname: req.session.userFullname,
			sid: req.session.sid,
			notifierId: Api.generateNotifierId(moduleName, req.sessionID),
			notifierSocket: req.app.locals.appConfig.notifierSocket,
			targetDirectory: context.getRootDirectory(),
			appsUrls: appsUrls
		}

	} catch (err) {
		throw err
	}


}



async function readDirektori(pathTujuan) {
	try {
		// readdir dengan opsi withFileTypes: true akan mengembalikan objek fs.Dirent
		const files = await readdir(pathTujuan, { withFileTypes: true });

		// Filter hanya yang berupa direktori, lalu ambil namanya
		const daftarDirektori = files
			.filter(item => item.isDirectory())
			.map(item => item.name);

		return daftarDirektori;
	} catch (error) {
		console.error("Gagal membaca direktori:", error);
		return [];
	}
}

async function generator_list(self, body) {
	const { criteria = {}, limit = 0, offset = 0, columns = [], sort = {} } = body
	const searchMap = {
		searchtext: `generator_modulename ILIKE '%' || \${searchtext} || '%' OR generator_id=try_cast_bigint(\${searchtext}, 0)`,
		appname: `generator_appname=\${appname}`
	};

	try {

		let dir = context.getRootDirectory();


		// baca dari direktori dir, ambil semua direktori yang didalamnya ada file {dirname}.gen.json
		let listResult = []
		let dirlist = await readDirektori(path.join(dir, 'public', 'modules'));
		for (let entry of dirlist) {
			// cek apakah di dalam {entry} ada file {entry}.gen.json
			const genFile = getGeneratorFile(entry);

			const exists = await access(genFile).then(() => true).catch(() => false);
			if (exists) {
				// baca file gen.json
				const genData = await readFile(genFile, 'utf8');
				const genJson = JSON.parse(genData);
				// console.log(genJson);

				const { appname, name, title, description } = genJson
				listResult.push({
					generator_id: name,
					generator_modulename: name,
					generator_title: title,
					generator_description: description
				})
			}
		}



		// hilangkan criteria '' atau null
		for (var cname in criteria) {
			if (criteria[cname] === '' || criteria[cname] === null) {
				delete criteria[cname]
			}
		}

		let { searchtext } = criteria

		// cari di listResult, untuk name, title atau description like %searchtext%, jika searchtext != null dan searchtext != ''
		let filteredResult = []
		if (searchtext != null && searchtext != '') {
			filteredResult = listResult.filter(item =>
				item.generator_modulename.toLowerCase().includes(searchtext.toLowerCase()) ||
				item.generator_title.toLowerCase().includes(searchtext.toLowerCase()) ||
				item.generator_description.toLowerCase().includes(searchtext.toLowerCase())
			)
		} else {
			filteredResult = listResult
		}


		// urutkan listResult berdasarkan name
		filteredResult.sort((a, b) => a.generator_modulename.localeCompare(b.generator_modulename))


		var max_rows = limit == 0 ? 50 : limit
		const rows = filteredResult

		var i = 0
		const data = []
		for (var row of rows) {
			i++
			if (i > max_rows) { break }
			data.push(row)
		}

		var nextoffset = null
		if (rows.length > max_rows) {
			nextoffset = offset + max_rows
		}

		return {
			criteria: criteria,
			limit: max_rows,
			nextoffset: nextoffset,
			data: data
		}

	} catch (err) {
		throw err
	}
}

async function generator_open(self, body) {
	const dir = context.getRootDirectory();

	try {
		const { id } = body
		const genFile = getGeneratorFile(id);
		const exists = await access(genFile).then(() => true).catch(() => false);
		if (!exists) {
			throw new Error("data tidak ditemukan")
		}


		// baca file gen.json
		const genData = await readFile(genFile, 'utf8');
		const genJson = JSON.parse(genData);

		genJson.directory = dir

		const data = {
			generator_id: id,
			generator_appname: genJson.appname,
			generator_modulename: genJson.name,
			generator_data: genJson,
			_createby: '',
			_createdate: '',
			_modifyby: '',
			_modifydate: ''
		}

		return data
	} catch (err) {
		throw err
	}
}

async function generator_save(self, body) {
	const { data } = body

	try {
		const name = data.name;
		delete data.id

		// untuk ditulis ke disk
		const jsonString = JSON.stringify(data, null, 2);
		const genFile = getGeneratorFile(name);

		//  tulis jsonString ke genFile
		await mkdir(path.dirname(genFile), { recursive: true });
		await writeFile(genFile, jsonString, 'utf8');


		const result = {
			generator_id: name
		}

		return result
	} catch (err) {
		throw err
	}
}


async function generator_generate(self, body) {
	const req = self.req
	const { data, clientId } = body
	const id = `${data.id}`
	const user_id = req.session.user.userId
	const user_name = req.session.user.userFullname
	const ipaddress = req.ip
	const dir = context.getRootDirectory();

	try {
		if (id == '') {
			throw new Error('save data dahulu sebelum generate')
		}

		// sebelumnya save dahulu
		const result = await generator_save(self, body)
		const generator_id = result.generator_id

		// generate di detached thread
		const generatorWorker = path.join(context.getWebappsDirectory(), 'src', 'generator', 'worker.js')
		const notifierServer = req.app.locals.appConfig.notifierServer
		runDetachedWorker(generatorWorker, notifierServer, clientId, {
			generator_id: generator_id,
			genFile: getGeneratorFile(generator_id),
			dirTarget: dir,
			user_id: user_id,
			user_name: user_name,
			ipaddress: ipaddress,
			timeout: generateTimeoutMs,
			ModuleDbContract: ModuleDbContract,
			jeda: 0.5, // jeda 0.5 detik per masing-masing generate
		})


		return {
			generator_id: generator_id
		}
	} catch (err) {
		throw err
	}
}



function getGeneratorFile(name) {
	const dir = context.getRootDirectory();
	const genFile = path.join(dir, 'generator', `${name}.gen.json`);
	return genFile;
}