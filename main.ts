import express from 'express'
import https from 'node:https'
import { createReadStream, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import expressWs from 'express-ws'
import { manageCookies } from './users'

const PORT = +process.env['PORT']
const CERT_DIR = process.env['CERT_DIR']
const FAVICON_PATH = resolve(__dirname + '/favicon.ico')
const NOT_FOUND_PATH = resolve(__dirname + '/404.html')
const ERROR_PATH = resolve(__dirname + '/500.html')
const GAMELIST_PATH = resolve(__dirname + '/gamelist.html')


const app = express()
expressWs(app)

Promise.all([
	import('./routes/tictactoe'),
	import('./routes/rooms'),
	import('./routes/snippet'),
	import('./routes/wengine')
]).then(([tictactoe, rooms, snippet, wengine]) => {
	app


	//? Games Router

	.use('/game', express.Router()
		.use(manageCookies)

		.get('/', (req, res) => {
			if (!req.originalUrl.endsWith('/')) return res.redirect('./game/')

			createReadStream(GAMELIST_PATH).pipe(res)
		})

		.use('/tictactoe', tictactoe.default)

		.use('/snippet', snippet.default)

		.ws('/rooms', rooms.default)
	)

	//? Demos Router

	.use('/demo', express.Router()
		.use('/wengine', wengine.default)
	)


	//? Favicon File

	.get('/favicon.ico', (req, res) => createReadStream(FAVICON_PATH).pipe(res))


	//? Default Redirect

	.get('/', (req, res) => res.redirect('./game/'))


	//? Not Found Page

	.use((req, res) => res.status(404).format({
		html() {
			createReadStream(NOT_FOUND_PATH).pipe(res)
		},

		json() {
			res.json({ error: 'Not Found' })
		},

		text() {
			res.send('Not Found')
		}
	}))


	//? Internal Server Error Handler Page

	.use(((err, req, res, next) => {
		console.error(`We got some error here [${req.method} ${req.path}]:\n${err.stack}`)

		res.status(500).format({
			html() {
				createReadStream(ERROR_PATH).pipe(res)
			},

			json() {
				res.json({ error: 'Internal Server Error' })
			},

			text() {
				res.send('Internal Server Error')
			}
		})
	}) as express.ErrorRequestHandler)

	//? Server Start

	https.createServer({
		cert: readFileSync(join(CERT_DIR, 'fullchain.pem')),
		key: readFileSync(join(CERT_DIR, 'privkey.pem'))
	}, app).listen(PORT, () => console.log(`https://localhost:${PORT} is listening...`))
})