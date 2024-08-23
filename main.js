"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const path_1 = require("path");
const express_ws_1 = __importDefault(require("express-ws"));
const users_1 = require("./users");
const PORT = 80;
const FAVICON_PATH = (0, path_1.resolve)(__dirname + '/favicon.ico');
const NOT_FOUND_PATH = (0, path_1.resolve)(__dirname + '/404.html');
const ERROR_PATH = (0, path_1.resolve)(__dirname + '/500.html');
const GAMELIST_PATH = (0, path_1.resolve)(__dirname + '/gamelist.html');
const app = (0, express_1.default)();
(0, express_ws_1.default)(app);
Promise.all([
    Promise.resolve().then(() => __importStar(require('./routes/tictactoe'))),
    Promise.resolve().then(() => __importStar(require('./routes/rooms'))),
    Promise.resolve().then(() => __importStar(require('./routes/snippet'))),
    Promise.resolve().then(() => __importStar(require('./routes/wengine')))
]).then(([tictactoe, rooms, snippet, wengine]) => {
    app
        //? Games Router
        .use('/game', express_1.default.Router()
        .use(users_1.manageCookies)
        .get('/', (req, res) => {
        if (!req.originalUrl.endsWith('/'))
            return res.redirect('./game/');
        (0, fs_1.createReadStream)(GAMELIST_PATH).pipe(res);
    })
        .use('/tictactoe', tictactoe.default)
        .use('/snippet', snippet.default)
        .ws('/rooms', rooms.default))
        //? Demos Router
        .use('/demo', express_1.default.Router()
        .use('/wengine', wengine.default))
        //? Favicon File
        .get('/favicon.ico', (req, res) => (0, fs_1.createReadStream)(FAVICON_PATH).pipe(res))
        //? Default Redirect
        .get('/', (req, res) => res.redirect('./game/'))
        //? Not Found Page
        .use((req, res) => res.status(404).format({
        html() {
            (0, fs_1.createReadStream)(NOT_FOUND_PATH).pipe(res);
        },
        json() {
            res.json({ error: 'Not Found' });
        },
        text() {
            res.send('Not Found');
        }
    }))
        //? Internal Server Error Handler Page
        .use(((err, req, res, next) => {
        console.error(`We got some error here [${req.method} ${req.path}]:\n${err.stack}`);
        res.status(500).format({
            html() {
                (0, fs_1.createReadStream)(ERROR_PATH).pipe(res);
            },
            json() {
                res.json({ error: 'Internal Server Error' });
            },
            text() {
                res.send('Internal Server Error');
            }
        });
    }))
        //? Server Start
        .listen(PORT, () => console.log(`http://localhost:${PORT} is listening...`));
});
