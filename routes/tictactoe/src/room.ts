export type EventOptions = Omit<AddEventListenerOptions, 'capture'>
export type Command = {
	name: string
	args?: string[]
}

export type RoomEventMap = {
	connect: Event
	command: CommandEvent
	message: CommandEvent
	exit: Event
	join: Event
	decline: DeclineEvent
}

export const invokeFor = (
	command: Command,
	callbacks: Record<string, (command: Command) => void>
) => {
	let listener = callbacks[command.name]
	if (!listener) listener = callbacks.default
	if (listener) listener(command)
}

/** `CommandEvent.propagates` is reset to `true` on every selection */
export const listenFor = (
	/** Works as `select` choosing listener from object by it's key.
	 * If no listener is found, `default` will be used */
	events: Record<string, (event: CommandEvent) => void>,
	/** Is invoked only if event's `propagates` property is `true` */
	after?: (event: CommandEvent) => void
) => (event: CommandEvent) => {
	event.propagates = true
	invokeFor(event, events)
	if (after && event.propagates) after(event)
}

export const parseCommand = (msg: string) => {
	const [cmd, ...args] = msg.split(':')
	if (!cmd) throw new Error(`Invalid message`, { cause: msg })
	const ret = { name: cmd } as Command
	if (args.length) ret.args = args

	return ret
}

export const serializeCommand = (msg: Command) => {
	let str = msg.name
	if (msg.args) str += ':' + msg.args.join(':')

	return str
}

export class CommandEvent extends Event implements Command {
	propagates = true

	name: string
	args?: string[]

	constructor(type: string, command: Command)
	constructor(type: string, cmd: string, args?: string[])
	constructor(type: string, arg1: string | Command, arg2?: string[]) {
		super(type, { cancelable: true })

		if (typeof arg1 === 'object') {
			this.name = arg1.name
			if (arg1.args) this.args = arg1.args
		} else {
			this.name = arg1
			if (arg2) this.args = arg2
		}
	}

	/** Sets `propagates` to false */
	stopPropagation() {
		this.propagates = false
	}
}

export class DeclineEvent extends Event {
	reason: string

	constructor(reason: string)
	constructor(cmd: Command)
	constructor(arg: string | Command) {
		super('decline')

		this.reason = typeof arg === 'string' ? arg : arg.args?.[0]
	}
}

export class Room extends EventTarget {
	#ws: WebSocket
	#serviceState: 0 | 1 | 2
	#state: 0 | 1 | 3 | 4
	#opponent: boolean

	#ready: Promise<void>
	#armReady() {
		this.#ready = new Promise<void>(res => {
			this.#triggerReady = res
		})
	}
	#triggerReady: () => void

	constructor(url: string) {
		super()

		this.#restate()
		this.connect(url)
	}

	#restate() {
		this.#serviceState = this.#state = Room.NOT_CONNECTED
		this.#opponent = false
		this.#armReady()
	}

	disconnect() {
		this.#ws.close()
		this.#ws = null
		this.#restate()
	}

	connect(url: string) {
		if (this.#serviceState !== Room.NOT_CONNECTED)
			throw new Error('Connection is already established')

		this.#restate()
		this.#serviceState = Room.CONNECTING

		this.#ws = new WebSocket(url)

		this.#ws.addEventListener('error', e => {
			this.#restate()
			this.#ws.close()

			this.emit(e)
		}, { once: true })

		this.#ws.addEventListener('open', () => {
			this.#serviceState = Room.CONNECTED
			this.emit(new Event('connect'))

			this.#ws.addEventListener('message', e => {
				const cmd = parseCommand(e.data.toString())

				if (this.emit(new CommandEvent('command', cmd))) {
					const err = (c: Command) => new Error('Server sent invalid command', {
						cause: serializeCommand(c)
					})
					invokeFor(cmd, {
						decline: c => this.emit(new DeclineEvent(c)),
						exit: () => {
							if (this.emit(new Event('exit'))) {
								if (this.#state === Room.GUEST)
									this.#state = Room.NOT_CONNECTED
								this.#opponent = false
								this.#armReady()
							}
						},
						hosted() {},
						joined: () => {
							if (this.emit(new Event('join'))) {
								this.#opponent = true
								this.#triggerReady()
							}
						},
						msg: c => {
							if (!c.args) throw err(c)

							const [cmd, ...args] = c.args
							const e = new CommandEvent('message', {name: cmd})
							if (args.length) e.args = args

							this.emit(e)
						},
						default(c) { throw err(c) }
					})
				}
			})
		}, { once: true })
	}

	async host() {
		return new Promise<string>((res, rej) => {
			if (this.#serviceState !== Room.CONNECTED)
				return rej('Not connected to server')

			if (this.#state !== Room.NOT_CONNECTED)
				return rej('Room is busy')

			this.#state = Room.CONNECTING
			this.#ws.send('host')
			this.once('command', listenFor({
				hosted: e => {
					this.#state = Room.HOST
					res(e.args[0])
					e.stopPropagation()
				},
				decline: e => {
					rej('Declined: ' + e.args[0])
				},
				default: e => {
					rej('Server response was invalid: ' + serializeCommand(e))
				}
			}, () => {
				this.#state = Room.NOT_CONNECTED
			}))
		})
	}

	async join(token: string) {
		return new Promise<true | 'room id is invalid' | 'room is full'>((res, rej) => {
			if (this.#serviceState !== Room.CONNECTED)
				return rej('Not connected to server')

			if (this.#state !== Room.NOT_CONNECTED)
				return rej('Room is in use')

			this.#state = Room.CONNECTING
			this.#ws.send('join:' + token)
			this.once('command', listenFor({
				joined: e => {
					this.#state = Room.GUEST
					res(true)
					e.stopPropagation()
				},
				decline: e => {
					if ([
						'room id is invalid',
						'room is full'
					].includes(e.args[0])) res(e.args[0] as unknown as true)
					else rej('Declined: ' + e.args[0])
				},
				default: e => rej('Server response was invalid: ' + serializeCommand(e))
			}, () => {
				this.#state = Room.NOT_CONNECTED
			}))
		})
	}

	exit() {
		this.#ws.send('exit')
		this.#state = Room.NOT_CONNECTED
		this.#opponent = false
	}

	send(msg: string): void
	send(msg: Command): void
	send(msg: Command | string) {
		if (typeof msg === 'object') msg = serializeCommand(msg)

		this.#ws.send('msg:' + msg)
	}

	on<K extends keyof RoomEventMap>(type: K, listener: (this: Room, e: RoomEventMap[K]) => any, options?: EventOptions) {
		this.addEventListener(type, listener, options)

		return this
	}

	once<K extends keyof RoomEventMap>(type: K, listener: (this: Room, e: RoomEventMap[K]) => any, options?: Omit<EventOptions, 'once'>) {
		const opts = { ...options, once: true } as EventOptions

		this.on(type, listener, opts)

		return this
	}

	emit(event: Event) {
		return this.dispatchEvent(event)
	}

	get serviceState() {
		return this.#serviceState
	}

	get state() {
		return this.#state
	}

	get opponent() {
		return this.#opponent
	}

	get ready() {
		return this.#ready
	}

	static get NOT_CONNECTED() { return 0 as const }
	static get CONNECTING() { return 1 as const }
	static get CONNECTED() { return 2 as const }

	static get HOST() { return 3 as const }
	static get GUEST() { return 4 as const }

	addEventListener<K extends keyof RoomEventMap>(type: K, listener: (this: Room, e: RoomEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
		super.addEventListener(type, listener, options)
	}

	removeEventListener<K extends keyof RoomEventMap>(type: K, listener: (this: Room, e: RoomEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
		super.removeEventListener(type, listener, options)
	}
}
