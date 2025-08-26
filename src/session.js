import session from 'express-session'; // session
import { createClient } from 'redis'; // session
import * as connectRedis from 'connect-redis';  // session


export async function createSession(options) {

	const redisUrl = options.redisUrl || 'redis://localhost:6379'
	const sessionName =  options.sessionName || 'sid'
	const sessionSecret = options.sessionSecret || 'rahasia'
	const sessionMaxAge = options.sessionMaxAge || 15 * 60 * 1000 // default 15 menit

	const RedisStore = connectRedis.RedisStore;


	console.log(`setup redis client ${redisUrl}`)
	const redisClient = createClient({
		url: redisUrl
	});
	await redisClient.connect(); 
	console.log('connected to redis server.')

	const redisStore = new RedisStore({
		client: redisClient,
		prefix: 'sess:',
	});


	const sessionConfig = {
		name: sessionName,
		store: redisStore,
		secret: sessionSecret,
		resave: false,
		saveUninitialized: false,
		rolling: true,
		cookie: {
			secure: false,
			httpOnly: true,
			maxAge: sessionMaxAge
		}
	}

	if (options.domain!==undefined) {
		sessionConfig.cookie['domain'] = options.domain
	}

	if (options.path!=undefined) {
		sessionConfig.cookie['path'] = options.path
	}

	// TODO: tambahkan untuk keperluan ini
	// domain: '.example.com',       // ✅ Cookie tersedia untuk semua subdomain
	// path: '/',                    // ✅ Berlaku untuk semua path
	// secure: true,                 // ✅ Hanya dikirim lewat HTTPS
	// httpOnly: true,              // ✅ Tidak bisa diakses dari JavaScript
	// sameSite: 'none',            // ✅ Bisa lintas domain (harus paired dengan secure)
	// maxAge: 15 * MINUTE,	

	console.log('starting session manager.')
	return session(sessionConfig)
}