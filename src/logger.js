import { dblog } from './db.js'


export default new (class {
	async access(user, modulename, url, errormessage) {
		console.log('logger access', modulename, url, errormessage)
	}

	
	async log(logdata) {
		const { id, user_id, user_name, moduleName, action, tablename, executionTimeMs, remark, metadata, ipaddress=''} = logdata
		const sql = `insert into datalog 
			(log_time, log_user_id, log_user_name, log_action, log_ipaddress, log_module, log_table, log_doc_id, log_remark, log_executiontime, log_metadata)
			values
			(now(), \${log_user_id}, \${log_user_name}, \${log_action}, \${log_ipaddress}, \${log_module}, \${log_table}, \${log_doc_id}, \${log_remark}, \${log_executiontime}, \${log_metadata})
		`
		const variable = {
			log_user_id: user_id, 
			log_user_name: user_name, 
			log_action: action,  
			log_ipaddress: ipaddress, 
			log_module: moduleName, 
			log_table: tablename, 
			log_doc_id: id, 
			log_remark: remark, 
			log_executiontime: executionTimeMs, 
			log_metadata: metadata
		}

		dblog.none(sql, variable)
	}


})()



