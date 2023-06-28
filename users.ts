import { Request, Response, NextFunction } from 'express'
import cookie from 'cookie'
import { WebSocket } from 'ws'

export type BufferLike =
	| string
	| Buffer
	| DataView
	| number
	| ArrayBufferView
	| Uint8Array
	| ArrayBuffer
	| SharedArrayBuffer
	| ReadonlyArray<any>
	| ReadonlyArray<number>
	| { valueOf(): ArrayBuffer }
	| { valueOf(): SharedArrayBuffer }
	| { valueOf(): Uint8Array }
	| { valueOf(): ReadonlyArray<number> }
	| { valueOf(): string }
	| { [Symbol.toPrimitive](hint: string): string }

const users = {} as Record<string, WebSocket>

export const randChar = () => {
	const r = Math.trunc(Math.random() * (26 + 10)) + 97

	const c = (r > 122) ? `${r - 123}` : String.fromCharCode(r)

	return c
}

export const genUID = (n: number) => {
	let uid = ''

	do {
		uid = new Array(n).fill(0).map(randChar).join('')
	} while (Object.hasOwn(users, uid))

	return uid
}

export const manageCookies = (req: Request, res: Response, next?: NextFunction) => {
	const cookies = cookie.parse(req.headers.cookie ?? '')

	if (!cookies.uid || !Object.hasOwn(users, cookies.uid)) {
		const uid = genUID(6)
		users[uid] = null
		res.setHeader(
			'Set-Cookie',
			cookie.serialize('uid', uid, {
				sameSite: 'strict',
				httpOnly: true,
				expires: new Date(2038, 0),
				path: '/game'
			})
		)
	}

	next?.()
}

export const setUser = (uid: string, user: WebSocket) => { users[uid] = user }

export const getUser = (uid: string) => users[uid]

export const toUser = (uid: string, data: BufferLike) => users[uid].send(data)

export const isUser = (uid: string) => Object.hasOwn(users, uid)