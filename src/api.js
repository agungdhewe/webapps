export default class Api {
	#req
	#res
	#next

	constructor(req, res, next) {
		this.#req = req
		this.#res = res
		this.#next = next
	}

	get req() { return this.#req }
	get res() { return this.#res }
	get next() { return this.#next }


	static generateNotifierId(moduleName, str) {
		return `${moduleName}-${str}`
	}


	cekLogin(req) {
		// jika req.session.user tidak ada datanya, berarti belum login 
		try {
			if (req.session.user==null) {
				throw new Error('belum login')
			}

			if (req.session.user.isLogin==null) {
				throw new Error('belum login')
			}

			if (req.session.user.isLogin==false) {
				throw new Error('belum login')
			}
		} catch (err) {
			err.code = 401
			throw err
		}
	}


	async handleRequest(methodName, body) {
		try {
			if (typeof this[methodName] === 'function') {
				const result = await this[methodName](body)
				return result 
			} else {
				const errNotFound = new Error(`Method "${methodName}" tidak ditemukan.`)
				errNotFound.code = 404 
				throw errNotFound
			}
		} catch (err) {
			throw err
		}
	}

	async log(data) {
		console.log(data)
	}
}


