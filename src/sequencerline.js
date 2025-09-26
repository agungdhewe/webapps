import sqlUtil from '@agung_dhewe/pgsqlc'

const MAX_LENGTH = 12
const tablename = "core.sequencer_line"


export function createSequencerLine(db, options) {
	return new Sequencer(db, options)
}


class Sequencer {
	
	
	#defaultOptions = {}


	db
	options 


	constructor(db, opt) {
		this.db = db
		this.options = {
			...this.#defaultOptions,
			...opt
		}
	}






	async increment(doc_id) {
		const self = this
		const db = self.db
		try {
			const { year, month } = await getDbCurrentDate(db)
			return await generateId(self, year, month, doc_id)
		} catch (err) {
			throw err
		}
	}

}
 

async function generateId(self, year, month, doc_id) {
	const options = self.options
	const db = self.db
	const searchMap = {
		seqnum: `sequencer_seqnum=\${seqnum}`,
		year: `sequencer_year=\${year}`,
		month: `sequencer_month=\${month}`
	};

	sqlUtil.connect(db)

	try {

		// ambil code doc
		const docparam = { doc_id }
		const sqldoc = `select doc_seqnum from core.doc where doc_id=\${doc_id}`
		const row = await db.oneOrNone(sqldoc, docparam)
		const seqnum = row!=null ? row.doc_seqnum : 0


		if (seqnum<0 || seqnum>99) {
			throw new Error(`doc_id: '${doc_id}' has doc seqnum '${seqnum}' that is invalid. doc seqnum have to in range 1-99 `)
		}


		// hitung total panjang bigint yang akan dihailkan
		let nlength = 0
		if  (month==0) {
			// yearly
			nlength += 2
		} else {
			// montly
			nlength += 4
		}

		if (seqnum>0) {
			nlength += 2 
		}



		// 25 09 01 000402 0000009

		const ln = nlength + self.options.numberLength
		if (ln > MAX_LENGTH) {
			throw new Error(`Total length of sequencer (${ln}) is mre than max length allowed(${MAX_LENGTH})`)
		}


		// ambil data sequencer
		{
			const criteria = { year, month, seqnum }
			const {whereClause, queryParams} = sqlUtil.createWhereClause(criteria, searchMap) 
	
			const columns = [
				'sequencer_id',
				'sequencer_year',
				'sequencer_month',
				'sequencer_seqnum',
				'sequencer_number',
				'EXTRACT(YEAR FROM sequencer_lastdate) AS lastyear',
				'EXTRACT(MONTH FROM sequencer_lastdate) AS lastmonth'
			]

			const sql = sqlUtil.createSqlSelect({tablename, columns, whereClause, sort:{}, limit:0, offset:0, queryParams}) + ' for update'
			const row = await db.oneOrNone(sql, queryParams)

			const obj = {}

			if (row!=null) {
				// console.log(row)
				obj.sequencer_id = row.sequencer_id
				obj._modifyby = 0
				obj._modifydate = (new Date()).toISOString()
				obj.sequencer_number = row.sequencer_number+1
				const cmd =  sqlUtil.createUpdateCommand(tablename, obj, ['sequencer_id'])
				await cmd.execute(obj)
			} else {
				obj._createby = 0
				obj._createdate = (new Date()).toISOString()
				obj.sequencer_year = year,
				obj.sequencer_month = month
				obj.sequencer_seqnum = seqnum
				obj.sequencer_number = 1
				obj.sequencer_lastdate = (new Date()).toISOString()
				obj.sequencer_remark = doc_id
				const cmd = sqlUtil.createInsertCommand(tablename, obj, ['sequencer_id'])
				await cmd.execute(obj)
			}

			// compose generated id
			const YY = String(year-2000).padStart(2, '0')
			const MM = String(month).padStart(2, '0')


			const tokennum = []
			tokennum.push(YY)
			tokennum.push(MM)

			if (seqnum>0) {
				tokennum.push(String(seqnum).padStart(2, '0'))
			}

			
			//  250901999999
			// 2509019999999
			const idpref = tokennum.join('')
			const numlen = MAX_LENGTH - idpref.length
			tokennum.push(String(obj.sequencer_number).padStart(numlen, '0'))

			const s =  tokennum.join('')
			return s
		}
	} catch (err) {
		throw err
	}
}

async function getDbCurrentDate(db) {
	try {
		const sql = "SELECT EXTRACT('year' FROM CURRENT_DATE) AS year, EXTRACT('month' FROM CURRENT_DATE) AS month"
		const row = await db.one(sql)

		const ret = {
			year: row.year,
			month: row.month
		}

		return ret
	} catch (err) {
		throw err
	}
}



