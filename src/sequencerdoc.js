import sqlUtil from '@agung_dhewe/pgsqlc'

const MAX_LENGTH = 19
const BLOCK_MAX_LENGTH = 5
const CLUSTER_MAX_LENGTH = 3
const tablename = "core.sequencer_doc"


export function createSequencerDocument(db, options) {
	return new Sequencer(db, options)
}


class Sequencer {
	
	
	#defaultOptions = {
		COMPANY_CODE: '00',
		blockLength: 3,
		numberLength: 6
	}


	db
	options 


	constructor(db, opt) {
		this.db = db
		this.options = {
			...this.#defaultOptions,
			...opt
		}
	}


	setBlock() {

	}

	setCluster() {

	}


	async yearly(doc_id, block=0) {
		const self = this
		const db = self.db
		try {
			const { year } = await getDbCurrentDate(db)
			const month = 0
			return await generateId(self, year, month, doc_id, block)
		} catch (err) {
			throw err
		}		
	}

	async monthly(doc_id, block=0) {
		const self = this
		const db = self.db
		try {
			const { year, month } = await getDbCurrentDate(db)
			return await generateId(self, year, month, doc_id, block)
		} catch (err) {
			throw err
		}
	}

}


function isValidDigitMax(n, length) {
  if (!Number.isInteger(n) || !Number.isInteger(length) || length <= 0) return false;

  const maxAllowed = Number('9'.repeat(length));
  return n <= maxAllowed;
}
 

async function generateId(self, year, month, doc_id, block) {
	const options = self.options
	const db = self.db
	const searchMap = {
		seqnum: `sequencer_seqnum=\${seqnum}`,
		block: `sequencer_block=\${block}`,
		seqclust: 'sequencer_cluster=\${seqclust}',
		year: `sequencer_year=\${year}`,
		month: `sequencer_month=\${month}`
	};

	sqlUtil.connect(db)

	try {
		if (!Number.isInteger(block)) {
			throw new Error(`block value: '${block}' is not integer`)
		}

		if (block<0 || !isValidDigitMax(block, options.blockLength)) {
			throw new Error(`block value: '${block}' is invalid. max length: ${options.blockLength} `)
		}


		// ambil code doc
		const docparam = { doc_id }
		const sqldoc = `select doc_prefix, doc_seqclust, doc_seqnum from core.doc where doc_id=\${doc_id}`
		const row = await db.oneOrNone(sqldoc, docparam)
		const prefix = row!=null ? row.doc_prefix : null
		const seqclust = row!=null ? row.doc_seqclust : 0
		const seqnum = row!=null ? row.doc_seqnum : 0


		if (seqclust<0 || seqclust>999) {
			throw new Error(`doc_id: '${doc_id}' has doc seqclust '${seqclust}' that is invalid. doc seqnum have to in range 0-999 `)
		}

		if (seqnum<0 || seqnum>99) {
			throw new Error(`doc_id: '${doc_id}' has doc seqnum '${seqnum}' that is invalid. doc seqnum have to in range 0-99 `)
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

		if (block>0) {
			nlength += self.options.blockLength
		}


		// 250901000402 0000009

		const ln = nlength + self.options.numberLength
		if (ln > MAX_LENGTH) {
			throw new Error(`Total length of sequencer (${ln}) is mre than max length allowed(${MAX_LENGTH})`)
		}



		

		// ambil data sequencer
		{
			const criteria = { year, month, seqnum, block, seqclust }
			if (block==null) {  
				criteria.block = 0 
			}


			const {whereClause, queryParams} = sqlUtil.createWhereClause(criteria, searchMap) 
			// console.log(year, month, whereClause, queryParams)

			const columns = [
				'sequencer_id',
				'sequencer_year',
				'sequencer_month',
				'sequencer_seqnum',
				'sequencer_block',
				'sequencer_cluster',
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
				obj.sequencer_block = block
				obj.sequencer_cluster = seqclust
				obj.sequencer_number = 1
				obj.sequencer_lastdate = (new Date()).toISOString()
				obj.sequencer_remark = doc_id
				const cmd = sqlUtil.createInsertCommand(tablename, obj, ['sequencer_id'])
				await cmd.execute(obj)
			}

			// compose generated id
			// DD05.YYMM.000.00.00000
			const YY = String(year-2000).padStart(2, '0')
			const MM = String(month).padStart(2, '0')

			const tokendoc = []
			const tokennum = []
			

			if (prefix!=null) {
				tokendoc.push(prefix)
			}

			if (options.COMPANY_CODE!='00' && options.COMPANY_CODE!=null) {
				tokendoc.push(options.COMPANY_CODE)
			}


			if (month>0) {
				//  monthly
				tokendoc.push('.')
				tokendoc.push(YY)
				tokendoc.push(MM)

				tokennum.push(YY)
				tokennum.push(MM)
			} else {
				// yearly
				tokendoc.push('.')
				tokendoc.push(YY)

				tokennum.push(YY)
			}

			if (seqnum>0) {
				tokennum.push(String(seqnum).padStart(2, '0'))
			}



			if (block>0) {
				const codeBlock = String(block).padStart(self.options.blockLength, '0')
				tokendoc.push('.')
				tokendoc.push(codeBlock)

				tokennum.push(codeBlock)
			}

			
			tokendoc.push('.')
			tokendoc.push(String(obj.sequencer_number).padStart(self.options.numberLength, '0'))

			const idpref = tokennum.join('')
			const numlen = MAX_LENGTH - idpref.length
			tokennum.push(String(obj.sequencer_number).padStart(numlen, '0'))

			const ret = {
				id: tokennum.join(''),
				doc: tokendoc.join('')
			}

			return ret
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


