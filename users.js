"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.toUser = exports.getUser = exports.setUser = exports.manageCookies = exports.genUID = exports.randChar = void 0;
const cookie_1 = __importDefault(require("cookie"));
const users = {};
const randChar = () => {
    const r = Math.trunc(Math.random() * (26 + 10)) + 97;
    const c = (r > 122) ? `${r - 123}` : String.fromCharCode(r);
    return c;
};
exports.randChar = randChar;
const genUID = (n) => {
    let uid = '';
    do {
        uid = new Array(n).fill(0).map(exports.randChar).join('');
    } while (Object.hasOwn(users, uid));
    return uid;
};
exports.genUID = genUID;
const manageCookies = (req, res, next) => {
    const cookies = cookie_1.default.parse(req.headers.cookie ?? '');
    if (!cookies.uid || !Object.hasOwn(users, cookies.uid)) {
        const uid = (0, exports.genUID)(6);
        users[uid] = null;
        res.setHeader('Set-Cookie', cookie_1.default.serialize('uid', uid, {
            sameSite: 'strict',
            httpOnly: true,
            expires: new Date(2038, 0),
            path: '/game'
        }));
    }
    next?.();
};
exports.manageCookies = manageCookies;
const setUser = (uid, user) => { users[uid] = user; };
exports.setUser = setUser;
const getUser = (uid) => users[uid];
exports.getUser = getUser;
const toUser = (uid, data) => users[uid].send(data);
exports.toUser = toUser;
const isUser = (uid) => Object.hasOwn(users, uid);
exports.isUser = isUser;
