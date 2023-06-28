import express from 'express'
import { resolve } from 'path'

const DIR_PATH = resolve(__dirname + '/snippet/dist/')

export default express.Router()

.use('/', express.static(DIR_PATH, { extensions: ['html', 'htm'] }))