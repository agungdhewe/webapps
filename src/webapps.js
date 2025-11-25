import ExpressServer from 'express';
import { createSession } from './session.js'
import context from './context.js'
import { createBasicRouter, uploader } from './router.js'
import { handleModuleNotfound } from './routers/handleModuleNotfound.js'
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import favicon from 'serve-favicon';
import * as path from 'node:path';
import * as helper from './helper.js'
import http from 'http'
import https from 'https'
import fs from 'fs'



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const defaultPort = 3000
const defaultRedisUrl = 'redis://localhost:6379'
const defaultSessionName = 'sid'
const defaultSessionSecret = 'rahasia'
const defaultSessionMaxAge = 15
const defaultSessionDomain = 'localhost'
const defaultSessionSecure = false
const defaultSessionHttpOnly = true


const defaultNotifierSocket = 'ws://localhost:8080'
const defaultNotifierServer = 'http://localhost:8080'


export function createWebApplication() {
	const webapp = new WebApplication()
	return webapp
}


export default class WebApplication {
	#startedOnce
	#express = ExpressServer();

	get defaultPort() { return defaultPort }
	get defaultRedisUrl() { return defaultRedisUrl }
	get defaultNotifierSocket() { return defaultNotifierSocket }
	get defaultNotifierServer() { return defaultNotifierServer }
	get defaultSessionName() { return defaultSessionName }
	get defaultSessionSecret() { return defaultSessionSecret }
	get defaultSessionMaxAge() { return defaultSessionMaxAge }
	get defaultSessionDomain() { return defaultSessionDomain }
	get defaultSessionSecure() { return defaultSessionSecure }
	get defaultSessionHttpOnly() { return defaultSessionHttpOnly }

	get express() { return this.#express}

	#__rootDirectory
	get __rootDirectory() { return this.#__rootDirectory }
	setRootDirectory(v) { 
		this.#__rootDirectory = v
	}


	constructor() {
		context.setWebappsDirectory(path.join(__dirname, '..'))
	}

	start(options) {
		if (this.__rootDirectory == undefined) {
			throw new Error('__rootDirectory belum didefinisikan')
		}

		context.setRootDirectory(this.__rootDirectory)	
		context.setFnParseModuleRequest(options.fnParseModuleRequest)

		if (this.#startedOnce) {
			throw new Error('start already called!')
		}
		this.#startedOnce = true

		// malai rutin utama untuk menjalankan server
		main(this, options)
	}

	
}


export function createDefaultAppConfig() {
	const sessionName = defaultSessionName
	const sessionSecret = defaultSessionSecret
	const sessionMaxAge = defaultSessionMaxAge
	const sessionDomain = defaultSessionDomain
	const sessionSecure = defaultSessionDomain
	const sessionHttpOnly = defaultSessionHttpOnly

	const notifierSocket = defaultNotifierSocket
	const notifierServer = defaultNotifierServer

	const redisUrl = defaultRedisUrl

	return {
		sessionName,
		sessionSecret,
		sessionMaxAge,
		sessionDomain,
		sessionSecure,
		sessionHttpOnly,

		notifierSocket,
		notifierServer,
		redisUrl
	}
}


async function main(self, options) {
	const __rootDirectory = self.__rootDirectory

	const app = self.express
	const port = options.port ?? self.defaultPort
	const startingMessage = options.startingMessage ?? `Starting webserver on port \x1b[1;33m${port}\x1b[0m`
	const appConfig = options.appConfig || createDefaultAppConfig()
	
	const basicRouter = createBasicRouter()
	const extendedRouter = options.router || ExpressServer.Router({ mergeParams: true });
	const router = ExpressServer.Router({ mergeParams: true });


	const redisUrl = appConfig.redisUrl
	const notifierSocket = appConfig.notifierSocket
	const notifierServer = appConfig.notifierServer

	const sessionName = appConfig.sessionName
	const sessionSecret = appConfig.sessionSecret
	const sessionMaxAge = appConfig.sessionMaxAge
	const sessionDomain = appConfig.sessionDomain
	const sessionSecure = appConfig.sessionSecure
	const sessionHttpOnly = appConfig.sessionHttpOnly

	const session = await createSession({ redisUrl, sessionName, sessionSecret, sessionMaxAge, sessionDomain, sessionSecure, sessionHttpOnly })


	router.use(uploader)

	router.use(extendedRouter) // extended akan dipanggil dahulu, sehingga akan meng-override basicRouter
	router.use(basicRouter)


	// setup variabel konfigurasi local, nanti bisa diakses dari router/api
	app.locals.appConfig = appConfig



	// konfigurasi applikasi
	app.set('trust proxy', true); // ini nanti diisi daftar host yang dipercaya sebagai proxy, baca dari env
	app.set("view engine", "ejs");
	app.set("views", [
		path.join(__rootDirectory, "views"),
		path.join(__rootDirectory, 'public', 'modules')
	]);

	// setup cors
	if (options.allowedOrigins!=null) {
		const allowedOrigins = options.allowedOrigins
		app.use(cors({
			credentials: true,
			origin: function (origin, callback) {
				if (!origin) return callback(null, true); // untuk server-side atau curl
				const isAllowed = allowedOrigins.some(o => {
					if (typeof o === 'string') return o === origin;
					if (o instanceof RegExp) return o.test(origin);
					return false;
				});

				if (isAllowed) {
					callback(null, true);
				} else {
					callback(new Error('Not allowed by CORS'));
				}
			},
			// methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			// allowedHeaders: ['Content-Type', 'Authorization'],
			// credentials: true
		}));
	} else {
		app.use(cors());
	}



	// setup middleware
	app.use(favicon(path.join(__rootDirectory, 'public', 'favicon.ico')));
	app.use(ExpressServer.json());
	app.use(ExpressServer.urlencoded({ extended: true }));
	app.use(session);


	// framework ini menggunakan library fgta5 untuk ui di client
	if (appConfig.fgta5jsDebugMode) {
		app.use('/public/libs/fgta5js', ExpressServer.static(path.join(__dirname, '..', 'libs', 'fgta5js')));
	} else {
		app.use('/public/libs/fgta5js', ExpressServer.static(path.join(__dirname, '..', 'libs', 'fgta5js-dist')));
	}
	
	app.use('/public/libs/webmodule', ExpressServer.static(path.join(__dirname, '..', 'libs', 'webmodule')));
	
	// Routing /public  untuk serve halaman-halaman static
	app.use('/public', rejectEjsFiles);
	app.use('/public', ExpressServer.static(path.join(__rootDirectory, 'public')));
	app.use('/', router)
	app.use(handleModuleNotfound)
	

	// const server = app.listen(port, ()=>{
	// 	console.log('\n\n' + startingMessage);
	// });

	// Buat server
	const server = createApplicationServer(app, port, startingMessage, appConfig)


	// Tangani event 'error' pada objek server
	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.error(`\n\x1b[31mError!\x1b[0m\nPort ${port} sudah digunakan. Silakan coba port lain.\n`);
		} else {
			console.error('\n\x1b[31mError!\x1b[0m\nTerjadi kesalahan saat memulai server:', err, "\n");
		}
		// Anda bisa memutuskan untuk keluar dari aplikasi atau mencoba port lain
		process.exit(1); // Keluar dengan kode error
	});
}


function createApplicationServer(app, port, startingMessage, appConfig) {
	const useSSL = appConfig.useSSL
	const sslKey = appConfig.sslKey
	const sslCertificate = appConfig.sslCertificate

	if (useSSL) {
		const sslOptions = {
			key: fs.readFileSync(sslKey), // path ke private key
			cert: fs.readFileSync(sslCertificate)     // path ke sertifikat
		};

		return https.createServer(sslOptions, app).listen(port, () => {
			console.log('\n\n' + startingMessage + ' (https)');
		});
	} else {
		return http.createServer({}, app).listen(port, () => {
			console.log('\n\n' + startingMessage);
		});
	}
}

function rejectEjsFiles(req, res, next) {
	const excludedExtensions = ['.ejs']; 
	const ext = path.extname(req.url);

	if (excludedExtensions.includes(ext)) {
		return res.status(403).send('Akses ke file ini tidak diperbolehkan');
	}

	next();
}