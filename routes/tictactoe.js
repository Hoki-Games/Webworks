"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const DIR_PATH = (0, path_1.resolve)(__dirname + '/tictactoe/dist/');
exports.default = express_1.default.Router()
    .use('/', express_1.default.static(DIR_PATH, { extensions: ['html', 'htm'] }));
