"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_1 = __importDefault(require("cookie"));
const users_1 = require("../users");
//? ---- UserDB Section ----
// TODO: Disconnect if AFK
const rooms = [];
const parseMessage = (msg) => {
    const [cmd, ...args] = msg.split(':');
    if (!cmd)
        throw new Error(`Invalid message`, { cause: msg });
    const ret = { cmd };
    if (args)
        ret.args = args;
    return ret;
};
const exitRoom = (uid) => {
    if (rooms.some((room, i) => {
        if (room[0] === uid) {
            rooms.splice(i, 1);
            if (room[1])
                (0, users_1.toUser)(room[1], 'exit');
            return true;
        }
        if (room[1] === uid) {
            room.pop();
            (0, users_1.toUser)(room[0], 'exit');
            return true;
        }
    }))
        return;
    (0, users_1.toUser)(uid, 'decline:not in a room');
};
//? ------------------------
// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
exports.default = ((ws, req) => {
    const uid = cookie_1.default.parse(req.headers.cookie ?? '').uid;
    if (!uid || !(0, users_1.isUser)(uid))
        return ws.close(1003, 'UID does not exist');
    if ((0, users_1.getUser)(uid))
        return ws.close(1008, 'UID is already in use');
    (0, users_1.setUser)(uid, ws);
    console.log('User connected to ws: ' + uid);
    ws.on('message', (data) => {
        try {
            const msg = parseMessage(data.toString());
            switch (msg.cmd) {
                case 'host':
                    if (rooms.some(room => {
                        if (room[0] === uid)
                            return +ws.send('decline:room already exists') || true;
                        if (room[1] === uid)
                            return +ws.send('decline:guest cannot host') || true;
                    }))
                        return;
                    rooms.push([uid]);
                    ws.send(`hosted:${uid}`);
                    break;
                case 'join':
                    const token = msg.args?.[0];
                    if (rooms.some(room => {
                        if (room[0] === uid)
                            return +ws.send('decline:host cannot join') || true;
                        if (room[1] === uid)
                            return +ws.send('decline:already in a room') || true;
                    }))
                        return;
                    if (token?.length !== 6 || !rooms.some(room => room[0] === token))
                        return ws.send('decline:room id is invalid');
                    const room = rooms.find(room => room[0] === token);
                    if (room.length > 1)
                        return ws.send('decline:room is full');
                    room.push(uid);
                    ws.send('joined');
                    (0, users_1.toUser)(room[0], 'joined');
                    break;
                case 'exit':
                    exitRoom(uid);
                    break;
                case 'msg':
                    if (rooms.some(room => {
                        if (room[0] === uid) {
                            const opponent = room[1];
                            if (!opponent)
                                return +ws.send('decline:room is empty') || true;
                            (0, users_1.toUser)(opponent, data);
                            return true;
                        }
                        if (room[1] === uid) {
                            (0, users_1.toUser)(room[0], data);
                            return true;
                        }
                    }))
                        break;
                default:
                    ws.send('decline:invalid command');
            }
        }
        catch (e) {
            ws.close(1003, e.message);
        }
    });
    ws.once('close', () => {
        exitRoom(uid);
        (0, users_1.setUser)(uid, null);
        console.log('User disconnected from ws: ' + uid);
    });
});
