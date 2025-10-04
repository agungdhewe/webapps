import { isFileExist } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import db from '../db.js'
import sqlUtil from '@agung_dhewe/pgsqlc'
import { createSequencerLine } from '../sequencerline.js' 
import logger from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createProgramData(context, options) {
	const apps_id = context.appname
	if (apps_id=='dev') {
		// untuk dev, tidak perlu diinput ke program
		return
	}


	const generator_id = context.id
	const rawData = context.icon
	const moduleName = context.moduleName
	const user_id = context.user_id
	const user_name = context.user_name
	const ipaddress = context.ipaddress
	const title = context.title
	const descr = context.descr
	const icon = context.icon=='' ? '' : `public/modules/${moduleName}/${options.iconFileName}`
	const tablename = 'core.program'


	const log = async (id, action, data={}, remark='') => {
		const source = 'generator'
		const metadata = JSON.stringify({})
		const executionTimeMs = 0
		
		const logdata = {id, user_id, user_name, moduleName, action, tablename, executionTimeMs, remark, metadata, ipaddress}
		logdata.moduleName = 'program'
		logdata.tablename = 'core.program'

		const ret = await logger.log(logdata)
		return ret
	}


	try {

		const sql = `select * from ${tablename} where generator_id = \${generator_id}`
		const row = await db.oneOrNone(sql, {generator_id})
	
		const obj = {
			program_title: title,
			apps_id : apps_id,
			program_name : moduleName,
			program_descr: descr,
			program_icon: icon,
			generator_id: generator_id,
		}

		const result = await db.tx(async tx=>{
			sqlUtil.connect(tx)

			if (row==null) {
				// insert
				const sequencer = createSequencerLine(tx, {})
				const program_id = await sequencer.yearlyshort('CNT')
				
				obj.program_id = program_id
				obj._createby =  user_id
				obj._createdate =  (new Date()).toISOString()

				const cmd = sqlUtil.createInsertCommand(tablename, obj)
				const ret = await cmd.execute(obj)

				// log
				log(obj.program_id, 'GENERATED') 

			} else {
				// update
				obj.program_id = row.program_id
				obj._modifyby =  user_id
				obj._modifydate =  (new Date()).toISOString()

				const cmd = sqlUtil.createUpdateCommand(tablename, obj, ['program_id'])
				const ret = await cmd.execute(obj)

				// log
				log(obj.program_id, 'REGENERATED') 
			}
		})

	} catch (err) {
		throw err
	}
}