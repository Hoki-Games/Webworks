import cookie from 'cookie'
import { WebsocketRequestHandler } from 'express-ws'
import { setUser, toUser, getUser, isUser } from '../users'

//? ---- UserDB Section ----
// TODO: Disconnect if AFK

const rooms = [] as [string, string?][]

type Command = {
	cmd: string
	args?: string[]
}
const parseMessage = (msg: string): Command => {
	const [cmd, ...args] = msg.split(':')
	if (!cmd) throw new Error(`Invalid message`, { cause: msg })
	const ret = { cmd } as Command
	if (args) ret.args = args

	return ret
}

const exitRoom = (uid: string) => {
	if (rooms.some((room, i) => {
		if (room[0] === uid) {
			rooms.splice(i, 1)
			if (room[1]) toUser(room[1], 'exit')
			return true
		}
		if (room[1] === uid) {
			room.pop()
			toUser(room[0], 'exit')
			return true
		}
	})) return;

	toUser(uid, 'decline:not in a room')
}
//? ------------------------

// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
export default ((ws, req) => {
	const uid = cookie.parse(req.headers.cookie ?? '').uid
	if (!uid || !isUser(uid)) return ws.close(1003, 'UID does not exist')

	if (getUser(uid)) return ws.close(1008, 'UID is already in use')

	setUser(uid, ws)
	console.log('User connected to ws: ' + uid)

	ws.on('message', (data) => {
		try {
			const msg = parseMessage(data.toString())

			switch (msg.cmd) {
				case 'host':
					if (rooms.some(room => {
						if (room[0] === uid) return +ws.send('decline:room already exists') || true
						if (room[1] === uid) return +ws.send('decline:guest cannot host') || true
					})) return;

					rooms.push([uid])
					ws.send(`hosted:${uid}`)
					break

				case 'join':
					const token = msg.args?.[0]
					if (rooms.some(room => {
						if (room[0] === uid) return +ws.send('decline:host cannot join') || true
						if (room[1] === uid) return +ws.send('decline:already in a room') || true
					})) return;

					if (token?.length !== 6 || !rooms.some(room => room[0] === token))
						return ws.send('decline:room id is invalid')

					const room = rooms.find(room => room[0] === token)
					if (room.length > 1) return ws.send('decline:room is full')

					room.push(uid)
					ws.send('joined')
					toUser(room[0], 'joined')
					break

				case 'exit':
					exitRoom(uid)
					break

				case 'msg':
					if (rooms.some(room => {
						if (room[0] === uid) {
							const opponent = room[1]
							if (!opponent) return +ws.send('decline:room is empty') || true

							toUser(opponent, data)
							return true
						}
						if (room[1] === uid) {
							toUser(room[0], data)
							return true
						}
					})) break

				default:
					ws.send('decline:invalid command')
			}
		} catch(e) { ws.close(1003, e.message) }
	})

	ws.once('close', () => {
		exitRoom(uid)
		setUser(uid, null)
		console.log('User disconnected from ws: ' + uid)
	})
}) as WebsocketRequestHandler