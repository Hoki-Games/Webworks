export const invokeFor = (command, callbacks) => {
    let listener = callbacks[command.name];
    if (!listener)
        listener = callbacks.default;
    if (listener)
        listener(command);
};
/** `CommandEvent.propagates` is reset to `true` on every selection */
export const listenFor = (
/** Works as `select` choosing listener from object by it's key.
 * If no listener is found, `default` will be used */
events, 
/** Is invoked only if event's `propagates` property is `true` */
after) => (event) => {
    event.propagates = true;
    invokeFor(event, events);
    if (after && event.propagates)
        after(event);
};
export const parseCommand = (msg) => {
    const [cmd, ...args] = msg.split(':');
    if (!cmd)
        throw new Error(`Invalid message`, { cause: msg });
    const ret = { name: cmd };
    if (args.length)
        ret.args = args;
    return ret;
};
export const serializeCommand = (msg) => {
    let str = msg.name;
    if (msg.args)
        str += ':' + msg.args.join(':');
    return str;
};
export class CommandEvent extends Event {
    propagates = true;
    name;
    args;
    constructor(type, arg1, arg2) {
        super(type, { cancelable: true });
        if (typeof arg1 === 'object') {
            this.name = arg1.name;
            if (arg1.args)
                this.args = arg1.args;
        }
        else {
            this.name = arg1;
            if (arg2)
                this.args = arg2;
        }
    }
    /** Sets `propagates` to false */
    stopPropagation() {
        this.propagates = false;
    }
}
export class DeclineEvent extends Event {
    reason;
    constructor(arg) {
        super('decline');
        this.reason = typeof arg === 'string' ? arg : arg.args?.[0];
    }
}
export class Room extends EventTarget {
    #ws;
    #serviceState;
    #state;
    #opponent;
    #ready;
    #armReady() {
        this.#ready = new Promise(res => {
            this.#triggerReady = res;
        });
    }
    #triggerReady;
    constructor(url) {
        super();
        this.#restate();
        this.connect(url);
    }
    #restate() {
        this.#serviceState = this.#state = Room.NOT_CONNECTED;
        this.#opponent = false;
        this.#armReady();
    }
    disconnect() {
        this.#ws.close();
        this.#ws = null;
        this.#restate();
    }
    connect(url) {
        if (this.#serviceState !== Room.NOT_CONNECTED)
            throw new Error('Connection is already established');
        this.#restate();
        this.#serviceState = Room.CONNECTING;
        this.#ws = new WebSocket(url);
        this.#ws.addEventListener('error', e => {
            this.#restate();
            this.#ws.close();
            this.emit(e);
        }, { once: true });
        this.#ws.addEventListener('open', () => {
            this.#serviceState = Room.CONNECTED;
            this.emit(new Event('connect'));
            this.#ws.addEventListener('message', e => {
                const cmd = parseCommand(e.data.toString());
                if (this.emit(new CommandEvent('command', cmd))) {
                    const err = (c) => new Error('Server sent invalid command', {
                        cause: serializeCommand(c)
                    });
                    invokeFor(cmd, {
                        decline: c => this.emit(new DeclineEvent(c)),
                        exit: () => {
                            if (this.emit(new Event('exit'))) {
                                if (this.#state === Room.GUEST)
                                    this.#state = Room.NOT_CONNECTED;
                                this.#opponent = false;
                                this.#armReady();
                            }
                        },
                        hosted() { },
                        joined: () => {
                            if (this.emit(new Event('join'))) {
                                this.#opponent = true;
                                this.#triggerReady();
                            }
                        },
                        msg: c => {
                            if (!c.args)
                                throw err(c);
                            const [cmd, ...args] = c.args;
                            const e = new CommandEvent('message', { name: cmd });
                            if (args.length)
                                e.args = args;
                            this.emit(e);
                        },
                        default(c) { throw err(c); }
                    });
                }
            });
        }, { once: true });
    }
    async host() {
        return new Promise((res, rej) => {
            if (this.#serviceState !== Room.CONNECTED)
                return rej('Not connected to server');
            if (this.#state !== Room.NOT_CONNECTED)
                return rej('Room is busy');
            this.#state = Room.CONNECTING;
            this.#ws.send('host');
            this.once('command', listenFor({
                hosted: e => {
                    this.#state = Room.HOST;
                    res(e.args[0]);
                    e.stopPropagation();
                },
                decline: e => {
                    rej('Declined: ' + e.args[0]);
                },
                default: e => {
                    rej('Server response was invalid: ' + serializeCommand(e));
                }
            }, () => {
                this.#state = Room.NOT_CONNECTED;
            }));
        });
    }
    async join(token) {
        return new Promise((res, rej) => {
            if (this.#serviceState !== Room.CONNECTED)
                return rej('Not connected to server');
            if (this.#state !== Room.NOT_CONNECTED)
                return rej('Room is in use');
            this.#state = Room.CONNECTING;
            this.#ws.send('join:' + token);
            this.once('command', listenFor({
                joined: e => {
                    this.#state = Room.GUEST;
                    res(true);
                    e.stopPropagation();
                },
                decline: e => {
                    if ([
                        'room id is invalid',
                        'room is full'
                    ].includes(e.args[0]))
                        res(e.args[0]);
                    else
                        rej('Declined: ' + e.args[0]);
                },
                default: e => rej('Server response was invalid: ' + serializeCommand(e))
            }, () => {
                this.#state = Room.NOT_CONNECTED;
            }));
        });
    }
    exit() {
        this.#ws.send('exit');
        this.#state = Room.NOT_CONNECTED;
        this.#opponent = false;
    }
    send(msg) {
        if (typeof msg === 'object')
            msg = serializeCommand(msg);
        this.#ws.send('msg:' + msg);
    }
    on(type, listener, options) {
        this.addEventListener(type, listener, options);
        return this;
    }
    once(type, listener, options) {
        const opts = { ...options, once: true };
        this.on(type, listener, opts);
        return this;
    }
    emit(event) {
        return this.dispatchEvent(event);
    }
    get serviceState() {
        return this.#serviceState;
    }
    get state() {
        return this.#state;
    }
    get opponent() {
        return this.#opponent;
    }
    get ready() {
        return this.#ready;
    }
    static get NOT_CONNECTED() { return 0; }
    static get CONNECTING() { return 1; }
    static get CONNECTED() { return 2; }
    static get HOST() { return 3; }
    static get GUEST() { return 4; }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, options);
    }
}
