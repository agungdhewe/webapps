import QueryStream from 'pg-query-stream';

export async function resetTimestamp(dbSource, dbTarget, tableName) {
	try {
		// ambil timestamp terlama dari dbSource, update ke dbTarget
		const row = await dbSource.one(`select to_char(min(_timestamp), 'YYYY-MM-DD HH24:MI:SS.MS OF') as mintimestamp from ${tableName}`)
		const { mintimestamp } = row
		console.log(`${tableName}: reset timestamp to`, mintimestamp)


		// update ke dbTarget
		await dbTarget.none(`update ${tableName} set _timestamp = $[mintimestamp]`, {
			mintimestamp: new Date(new Date(mintimestamp).getTime() - (60 * 60 * 1000))
		})

	} catch (err) {
		throw err
	}
}


export async function prepareData(dbSource, dbTarget, batch_id, tableName, tableSyncName, tableDeletedName, pk) {
	try {

		// hapus data temp.sync*** yang expired
		await dbSource.query(`delete from ${tableSyncName} where _expired<NOW()`)

		// cek timestamp terbaru dari dbTarget saat ini
		const row = await dbTarget.oneOrNone(`select to_char(max(_timestamp), 'YYYY-MM-DD HH24:MI:SS.MS OF') as maxtimestamp from ${tableName}`)
		const { maxtimestamp } = row

		// jika maxtimestamp null, ambil min timestamp dari dbSource
		const timestamp = await (async () => {
			if (maxtimestamp) {
				return maxtimestamp
			}
			const row = await dbSource.oneOrNone(`select to_char(min(_timestamp) , 'YYYY-MM-DD HH24:MI:SS OF') as mintimestamp from ${tableName}`)
			const { mintimestamp } = row
			return mintimestamp
		})()


		// siapkan data yang akan di sync UPDATE
		const sqlPrepareUpdate = `
				insert into ${tableSyncName} (batch_id, ${pk}, _expired, _timestamp)
				select 
					$[batch_id] as batch_id, 
					${pk}, 
					NOW() + ($[minutes] * INTERVAL '1 minute') as _expired,
					_timestamp
				from ${tableName} 
				where 
					_timestamp > $[maxtimestamp] 
				order by _timestamp
			`


		// console.log(sqlPrepareUpdate)

		await dbSource.none(sqlPrepareUpdate, {
			batch_id,
			minutes: 10,
			maxtimestamp: timestamp
		})


		// siapkan data yang akan di sync DELETE
		const sqlPrepareDelete = `
			insert into ${tableSyncName} (batch_id, ${pk}, _expired, _timestamp, _isdelete)
			select 
				$[batch_id] as batch_id, 
				${pk}, 
				NOW() + ($[minutes] * INTERVAL '1 minute') as _expired,
				_timestamp,
				true as _isdelete
			from ${tableDeletedName}
			where 
				_timestamp > $[maxtimestamp] 
			order by _timestamp`

		await dbSource.none(sqlPrepareDelete, {
			batch_id,
			minutes: 10,
			maxtimestamp
		})

	} catch (err) {
		throw err
	}
}




export async function syncChangedData(dbSource, dbTarget, batch_id, tableName, tableSyncName, tableDeletedName, pk, processBatch) {
	try {
		if (typeof processBatch !== 'function') {
			throw new Error('processBatch seharusnya function processBatch(dbSource, dbTarget, batch)')
		}

		// ambil data
		const sql = `
			select B.*, A._isdelete 
			from ${tableSyncName} A left join ${tableName} B on B.${pk}=A.${pk}
			where
				A.batch_id = $1
			and B.${pk} is not null
			order by A._timestamp, A.${pk}
		`
		const qs = new QueryStream(sql, [batch_id], { batchSize: 10 });
		await dbSource.stream(qs, (stream) => {
			return new Promise((resolve, reject) => {
				let batch = [];

				stream.on('data', async (row) => {
					batch.push(row);

					if (batch.length === 10) {
						stream.pause();
						try {
							const currentBatch = batch;
							batch = [];
							await processBatch(dbSource, dbTarget, currentBatch);
							stream.resume();
						} catch (error) {
							stream.destroy(error);
						}
					}
				});

				stream.on('end', async () => {
					try {
						if (batch.length > 0) {
							await processBatch(dbSource, dbTarget, batch);
							batch = [];
						}
						resolve();
					} catch (error) {
						reject(error);
					}
				});

				stream.on('error', (error) => {
					reject(error);
				});
			});
		});
	} catch (err) {
		throw err
	}
}


export async function clearBatch(dbSource, batch_id, tableName, tableSyncName, tableDeletedName, pkAuth) {
	try {
		const sql = `delete from ${tableSyncName}  where batch_id = $[batch_id]`
		await dbSource.none(sql, { batch_id })
	} catch (err) {
		throw err
	}
}


export function createSqlUpsert(tableName, keys, fields) {
	const sqlstring = []
	const updateField = []
	const insertField = []
	const insertValue = []

	for (let fieldName of fields) {
		insertField.push(fieldName)
		insertValue.push(`\$[${fieldName}]`)

		if (keys.includes(fieldName)) {
			continue
		}
		updateField.push(`${fieldName} = EXCLUDED.${fieldName}`)
	}

	sqlstring.push(`insert into ${tableName}(\n`)
	sqlstring.push(insertField.join(', '))
	sqlstring.push(`) values(\n`)
	sqlstring.push(insertValue.join(', '))
	sqlstring.push(`) on conflict(${keys.join(', ')}) do update set\n`)
	sqlstring.push(updateField.join(",\n"))

	const sql = sqlstring.join('')

	return sql
}