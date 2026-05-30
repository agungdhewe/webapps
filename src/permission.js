export async function getUserPermission(db, user_id, permission_name) {
	try {

		// cek permission
		const sqlCekPermission = 'select * from core.get_user_permission(${user_id}, ${permission_name})'
		const rows = await db.any(sqlCekPermission, {
			user_id: user_id,
			permission_name: permission_name
		});


		if (rows.length == 0) {
			return false
		} else {
			return true
		}
	} catch (err) {
		throw err
	}
}