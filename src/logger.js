import { dblog } from './db.js'


export default new (class {
	access(user, modulename, url, errormessage) {
		console.log('logger access', modulename, url, errormessage)
	}
})()

