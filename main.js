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
const node_https_1 = __importDefault(require("node:https"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const express_ws_1 = __importDefault(require("express-ws"));
const users_1 = require("./users");
const PORT = +process.env['PORT'];
const CERT_DIR = process.env['CERT_DIR'];
const FAVICON_PATH = (0, node_path_1.resolve)(__dirname + '/favicon.ico');
const NOT_FOUND_PATH = (0, node_path_1.resolve)(__dirname + '/404.html');
const ERROR_PATH = (0, node_path_1.resolve)(__dirname + '/500.html');
const GAMELIST_PATH = (0, node_path_1.resolve)(__dirname + '/gamelist.html');
const app = (0, express_1.default)();
const server = node_https_1.default.createServer({
    cert: (0, node_fs_1.readFileSync)((0, node_path_1.join)(CERT_DIR, 'fullchain.pem')),
    key: (0, node_fs_1.readFileSync)((0, node_path_1.join)(CERT_DIR, 'privkey.pem'))
}, app);
(0, express_ws_1.default)(app, server);
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
        (0, node_fs_1.createReadStream)(GAMELIST_PATH).pipe(res);
    })
        .use('/tictactoe', tictactoe.default)
        .use('/snippet', snippet.default)
        .ws('/rooms', rooms.default))
        //? Demos Router
        .use('/demo', express_1.default.Router()
        .use('/wengine', wengine.default))
        //? Magnet Redirector
        .get('/magnet:', (req, res) => res.redirect(`magnet:?${req.url.match(/\/magnet:\/?\?(.+$)/)[1]}`))
        //? Favicon File
        .get('/favicon.ico', (req, res) => (0, node_fs_1.createReadStream)(FAVICON_PATH).pipe(res))
        //? Default Redirect
        .get('/', (req, res) => res.redirect('./game/'))
        //? Not Found Page
        .use((req, res) => res.status(404).format({
        html() {
            (0, node_fs_1.createReadStream)(NOT_FOUND_PATH).pipe(res);
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
                (0, node_fs_1.createReadStream)(ERROR_PATH).pipe(res);
            },
            json() {
                res.json({ error: 'Internal Server Error' });
            },
            text() {
                res.send('Internal Server Error');
            }
        });
    }));
    //? Server Start
    server.listen(PORT, () => console.log(`https://localhost:${PORT} is listening...`));
});
