import dotenv from 'dotenv'
import { Worker } from 'worker_threads'

dotenv.config()



console.log('Testing Generator')

const args = process.argv.slice(2)
const generator_id = args[0]

if (generator_id==null) {
	console.log("\n\n\x1b[1m\x1b[31mERROR\x1b[0m")
	console.log("format: npm run generate \x1b[33m<generator_id>\x1b[0m\n\n")
	process.exit(1)
}


const workerTimeoutMs = 1*60*1000

const ModuleDbContract = {
	apps: {
		table: 'core."apps"'
	},
	generator: {
		table: 'core.generator'
	}
}

await main(generator_id)


async function main(generator_id) {
	console.log(`Start to generate program id:'${generator_id}'`)

	try {
		const workerPath = './src/generator/worker.js'
		const worker = new Worker(workerPath, {
			workerData: {
				generator_id,
				user_id: 1,
				user_name: 'coredeveloper',
				ipaddress: 'local-cli',
				ModuleDbContract: ModuleDbContract,
			}
		}, workerTimeoutMs) 

		const timeoutId = setTimeout(()=>{
			console.log("\n\n\x1b[1m\x1b[31mERROR\x1b[0m")
			console.log('Worker timeout')
			worker.terminate()
		}, workerTimeoutMs) 


		worker.on('message', (info)=>{
			clearTimeout(timeoutId)
			console.log(info.message)
			if (info.done===true) {
				worker.done = true
				worker.terminate()
			}
		})


		worker.on('error', (err)=>{
			clearTimeout(timeoutId)
			console.log("\n\n\x1b[1m\x1b[31mERROR\x1b[0m")
			console.error(err)
			console.log("\n\n")
			worker.terminate()
		})


		worker.on('exit', (code)=>{
			clearTimeout(timeoutId)
			if (worker.done===true) {
				console.log('Worker finished')
			} else {
				console.log(`Worker exited with code ${code}`)
			}
			console.log("\n\n")
		})


	} catch (err) {
		console.log("\n\n\x1b[1m\x1b[31mERROR\x1b[0m")
		console.log(err.message)
		process.exit(1)
	}
}

