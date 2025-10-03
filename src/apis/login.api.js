import pgp from 'pg-promise';

import sqlUtil from '@agung_dhewe/pgsqlc'
import context from '../context.js'
import db from '../db.js'
import Api from '../api.js'
import bcrypt from 'bcrypt';



export default class extends Api {
	constructor(req, res, next) {
		super(req, res, next);

		this.currentState = {}
		try {
			Api.cekLogin(req)
			this.currentState.isLogin = true
		} catch (err) {
			// tidak perlu throw error, karna hanya untuk cek sudah login apa belum
			this.currentState.isLogin = false
		}

	}

	// dipanggil dengan model snake syntax
	// contoh: header-list
	//         header-open-data
	async init(body) { return await login_init(this, body) }	
	async doLogin(body) { return await login_doLogin(this, body) }	
	async doLogout(body) { return await login_doLogout(this, body) }
}


async function login_init(self, body) {
	const req = self.req
	if (self.currentState.isLogin) {
		req.session.sid = req.sessionID
	}

	return {
		isLogin: self.currentState.isLogin
	}
}

async function login_doLogin(self, body) {
	try {
		const {username, password} = body
		
		const sql = 'select * from core.user where user_name = ${username}'
		const param = { username }
		const row = await db.oneOrNone(sql, param)

		if (row==null) {
			return null
		}


		const userId = row.user_id
		const userName = row.user_name
		const userFullname = row.user_fullname
		const hashedPassword = row.user_password

		const match = await bcrypt.compare(password, hashedPassword);
		if (!match) {
			return null
		} 


		// simpan di session
		self.req.session.user = {
			userId,
			userName,
			userFullname,
			isLogin: true
		}

		return self.req.session.user

		// // dummy login dulu
		// if (username=='agung') {
		// 	// setup session
		// 	const user_id = '2590000000000000001'
		// 	self.req.session.user = {
		// 		userId: user_id,
		// 		userName: 'agung',
		// 		userFullname: 'Agung Nugroho',
		// 		isLogin: true
		// 	}

		// 	return self.req.session.user
		// } else {
		// 	return null
		// }
	} catch (err) {
		throw err
	}
}

async function login_doLogout(self, body) {
	try {
		self.req.session.user = null
		return true
	} catch (err) {
		throw err
	}
}