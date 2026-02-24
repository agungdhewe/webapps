

export default async function notifyClient(notifierServer, clientId, status, info) {
	try {

		const method = 'POST'
		const data = { clientId, status, info }
		const url = `${notifierServer}/notify`
		const response = await fetch(url, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			const httpErrorStatus = response.status
			const httpErrorStatustext = response.statusText
			const err = new Error(`${httpErrorStatus} ${httpErrorStatustext}: ${method} ${url}`)
			err.code = httpErrorStatus
			throw err
		}

		return response
	} catch (err) {
		throw err
	}
}