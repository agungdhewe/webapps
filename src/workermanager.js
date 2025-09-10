import { Worker } from 'worker_threads';


export const runDetachedWorker = (workerPath, notifierServer, clientId, options) => {
	const timeout = options.timeout || 10000

	// cek dulu apakah valid
	try {
		if (clientId==null || notifierServer==null) {
		throw new Error('clientId / notifierServer belum didefinisikan di parameter runDetachedWorker')  
		}
	} catch (err) {
		throw err
	}


	console.log('Starting worker')
	const worker = new Worker(workerPath, {
		workerData: options
	});

	const timeoutId = setTimeout(() => {
		console.warn('Worker timeout, terminating...');
		notifyClient(notifierServer, clientId, 'timeout')     // nofify ke clent, kalau timeout
		worker.terminate();
	}, timeout);

	worker.on('message', (info) => {
		clearTimeout(timeoutId);
		console.log('Worker message:', 'message', info);
		if (info.done===true) {
			notifyClient(notifierServer, clientId, 'done', info)     // nofify message ke clent
			// worker.terminate(); // Optional: let it exit naturally if preferred
		} else {
			notifyClient(notifierServer, clientId, 'message', info)     // nofify message ke clent
		}
	});

	worker.on('error', (err) => {
		clearTimeout(timeoutId);
		console.error('Worker error:', err);
		notifyClient(notifierServer, clientId, 'error', {message: err.message})     // nofify error ke clent
		worker.terminate();
	});

	worker.on('exit', (code) => {
		clearTimeout(timeoutId);
		notifyClient(notifierServer, clientId, 'done', {})  
		console.log(`🚪 Worker exited with code ${code}`);
	});
};



async function notifyClient(notifierServer, clientId, status, info) {
	try {
		console.log(status)
		console.log('notify to:' , notifierServer)
		console.log(clientId)

		const data = {clientId, status, info}
		const url = `${notifierServer}/notify`
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			const status = response.status
			const statustext = response.statusText
			const err = new Error(`${status} ${statustext}: ${options.method} ${url}`)
			err.code = status
			throw err
		}
		
		return response
	} catch (err) {
		throw err
	}
}