import dotenv from 'dotenv';
import pgp from 'pg-promise';

dotenv.config();

const initOptions = {
    // Misalnya, event untuk memantau query atau error
    // query: (e) => {
    //     console.log('QUERY:', e.query);
    // },
    // error: (err, e) => {
    //     console.log('ERROR:', err, e.query);
    // }
	

	// connect: (client, dc, isFresh) => {
    //     // Objek klien yang sebenarnya adalah client.client
    //     if (client.client) { 
    //         client.client.on('notice', msg => {
    //             console.warn('PostgreSQL Notice:', msg.message);
    //         });
    //     }
    // }

};

const pgpInstance = pgp(initOptions); // <-- Panggil pgp() hanya satu kali di sini


const configDb = {
    port: process.env.DB_PORT,
    host:  process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
}




const db = pgpInstance(configDb);
export default db

db.connect()
	.then(obj => {
		console.log('Connected to Primary Database!');
		obj.done(); // Klien dikembalikan ke pool
	})
	.catch(error => {
		console.error("\n\x1b[31mError!\x1b[0m\ncannot connect to Database:", error.message || error, "\n");
		process.exit(1);
	});






const configDbLog = {
	port: process.env.LOGGER_DB_PORT,
	host:  process.env.LOGGER_DB_HOST,
	database: process.env.LOGGER_DB_NAME,
	user: process.env.LOGGER_DB_USER,
	password: process.env.LOGGER_DB_PASS,
}

export const dblog = pgpInstance(configDbLog);

if (configDbLog.host!==undefined) {

	dblog.connect()
		.then(obj => {
			console.log('Connected to Logger Database!');
			obj.done(); // Klien dikembalikan ke pool
		})
		.catch(error => {
			console.error('\n\x1b[31mError!\x1b[0m cannot\nconnect to Logger Database:', error.message || error, "\n");
			process.exit(1);
		});
}	

