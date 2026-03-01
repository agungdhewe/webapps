
export async function authorizeRequest(db, req) {
	const moduleName = req.params.modulename;
	const program_id = req.query.prog;

	try {

		// jika belum login
		if (req.session.user == null) {
			const nextUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
			const err = new Error(`Belum login. Anda harus <a href="login?nexturl=${nextUrl}">login</a> dulu untuk mengakses resource ini`)
			err.status = 401
			err.code = 401
			throw err
		}

		const user_id = req.session.user.userId
		const user_fullname = req.session.user.userFullname
		const developerAccess = req.session.user.developerAccess


		// jika punya akses developer boleh buka semuanya
		const sqlUser = 'select * from core.user where user_id=${user_id} and user_isdev=true'
		const rowUser = await db.oneOrNone(sqlUser, { user_id })
		if (rowUser != null) {
			return true  // user adalah developer
		}

		// jika tidak punya akses developer, cek apakah boleh buka program 
		const sql = 'select * from core.get_user_programs(${user_id}) where id=${program_id}'
		const row = await db.oneOrNone(sql, { user_id, program_id });
		if (row != null) {
			return true  // user punya akses program
		}

		const err = new Error(`user '${user_fullname}' tidak diperbolehkan mengakses program '${moduleName}'`)
		err.status = 401
		err.code = 401
		throw err

	} catch (err) {
		throw err
	}
}

export async function getApplicationSetting(db, tablename = 'core.setting') {
	const setting = {}
	try {
		const sql = `select setting_id, setting_value from ${tablename}`
		const rows = await db.any(sql);
		for (var row of rows) {
			const setting_id = row.setting_id
			const setting_value = row.setting_value
			setting[setting_id] = setting_value
		}

		setting.SETTING_TABLE_NAME = tablename
		return setting
	} catch (err) {
		throw err
	}
}


export async function requireSetting(db, setting, setting_id, descr) {
	if (setting[setting_id] !== undefined) {
		// setting sudah ada
		return true
	} else {
		const tablename = setting.SETTING_TABLE_NAME
		const unset = '*** unset ***'

		// cek di database
		const sqlCek = `select setting_value from ${tablename} where setting_id=\${setting_id}`
		const rowCek = await db.oneOrNone(sqlCek, { setting_id })
		if (rowCek == null) {
			throw new Error(`setting '${setting_id}' tidak ditemukan di data setting ${tablename}`)
		}

		const value = rowCek.setting_value
		if (value == unset) {
			throw new Error(`setting '${setting_id}' belum di set`)
		}

		// buat dulu di database
		const sql = `
			insert into ${tablename}
			(setting_id, setting_value, setting_descr, _createby)
			values
			(\${setting_id}, \${defaultValue}, \${descr}, '240100000')`
		await db.none(sql, { setting_id, defaultValue: unset, descr })

		throw new Error(`setting ${setting_id} belum diisi di ${tablename}\n`)
	}

}