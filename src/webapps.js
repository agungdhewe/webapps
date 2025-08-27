import ExpressServer from 'express';
import { createSession } from './session.js'
import context from './context.js'
import { createBasicRouter, uploader } from './router.js'
import { handleModuleNotfound } from './routers/handleModuleNotfound.js'
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import favicon from 'serve-favicon';
import * as path from 'node:path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const SECOND = 1000
const MINUTE = 60 * SECOND

const defaultPort = 300
const defaultRedisUrl = 'redis://localhost:6379'
const defaultSessionName = 'sid'
const defaultSessionSecret = 'rahasia'
const defaultSessionMaxAge = 15 * MINUTE
const defaultNotifierSocket = 'ws://localhost:8080'
const defaultNotifierServer = 'http://localhost:8080'


export function createWebApplication() {
	const webapp = new WebApplication()
	return webapp
}


export default class WebApplication {
	#startedOnce
	#express = ExpressServer();

	static get defaultPort() { return defaultPort }
	static get defaultRedisUrl() { return defaultRedisUrl }
	static get defaultNotifierSocket() { return defaultNotifierSocket }
	static get defaultNotifierServer() { return defaultNotifierServer }

	get express() { return this.#express}

	#__rootDirectory
	get __rootDirectory() { return this.#__rootDirectory }
	setRootDirectory(v) { this.#__rootDirectory = v}


	constructor() {
		context.setMyDirectory(path.join(__dirname, '..'))
	}

	start(options) {
		if (this.__rootDirectory == undefined) {
			throw new Error('__rootDirectory belum didefinisikan')
		}

		context.setRootDirectory(this.__rootDirectory)	

		if (this.#startedOnce) {
			throw new Error('start already called!')
		}
		this.#startedOnce = true

		// malai rutin utama untuk menjalankan server
		main(this, options)
	}

	
}



async function main(self, options) {
	const __rootDirectory = self.__rootDirectory

	const app = self.express
	const port = options.port ?? self.defaultPort
	const startingMessage = options.startingMessage ?? `Starting webserver on port ${port}`
	const redisUrl = options.redisUrl || self.defaultRedisUrl
	const notifierSocket = options.notifierSocket || self.defaultNotifierSocket
	const notifierServer = options.notifierServer || self.defaultNotifierServer
	const appConfig = options.appConfig || {}
	const basicRouter = createBasicRouter()
	const extendedRouter = options.router || ExpressServer.Router({ mergeParams: true });
	const router = ExpressServer.Router({ mergeParams: true });

	const sessionName = defaultSessionName // TODO: baca dari environtment
	const sessionSecret = defaultSessionSecret
	const sessionMaxAge = defaultSessionMaxAge
	const session = await createSession({ redisUrl, sessionName, sessionSecret, sessionMaxAge })

	router.use(uploader)
	router.use(extendedRouter) // extended akan dipanggil dahulu, sehingga akan meng-override basicRouter
	router.use(basicRouter)


	// setup variabel konfigurasi local, nanti bisa diakses dari router/api
	app.locals.appConfig = {
		...{
			notifierSocket,
			notifierServer
		},
		...appConfig
	};



	// konfigurasi applikasi
	app.set('trust proxy', true); // ini nanti diisi daftar host yang dipercaya sebagai proxy, baca dari env
	app.set("view engine", "ejs");
	app.set("views", [
		path.join(__rootDirectory, "views"),
		path.join(__rootDirectory, "..", 'public', 'modules')
	]);

	// setup middleware
	app.use(cors());
	app.use(favicon(path.join(__rootDirectory, '..', 'public', 'favicon.ico')));
	app.use(ExpressServer.json());
	app.use(ExpressServer.urlencoded({ extended: true }));
	app.use(session);


	// Routing /public  untuk serve halaman-halaman static
	
	app.use('/public', rejectEjsFiles);
	app.use('/public', ExpressServer.static(path.join(__rootDirectory, '..', 'public')));
	app.use('/', router)
	app.use(handleModuleNotfound)
	

	const server = app.listen(port, ()=>{
		console.log('\n\n' + startingMessage);
	});

	// Tangani event 'error' pada objek server
	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.error(`Port ${port} sudah digunakan. Silakan coba port lain.`);
		} else {
			console.error('Terjadi kesalahan saat memulai server:', err);
		}
		// Anda bisa memutuskan untuk keluar dari aplikasi atau mencoba port lain
		process.exit(1); // Keluar dengan kode error
	});
}


function rejectEjsFiles(req, res, next) {
	const excludedExtensions = ['.ejs']; 
	const ext = path.extname(req.url);

	if (excludedExtensions.includes(ext)) {
		return res.status(403).send('Akses ke file ini tidak diperbolehkan');
	}

	next();
}