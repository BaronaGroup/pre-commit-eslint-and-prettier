#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import bodyParser from 'body-parser'
import express from 'express'
import { context as karhuContext } from 'karhu'
import memoize from 'lodash/memoize'

const log = karhuContext('style-server')

const app = express()
const port = +(process.env.BSS_PORT || process.env.PORT || '15077')

app.use(bodyParser.text({limit: 1024 * 1024 * 10}))

let lastRequest = new Date()

const getCliEngine = memoize(dir => {
  const cwd = process.cwd()
  process.chdir(dir)
  const cli = new (requireLib(dir, 'eslint').CLIEngine)({})
  process.chdir(cwd)
  return cli
})

app.use((_req, _res, next) => {
  lastRequest = new Date()
  next()
})

app.post('/eslint', (req, res) => {
  const { filename, baseDir } = req.query,
    body = req.body

  const cli = getCliEngine(path.dirname(path.resolve(baseDir, filename)))
  const report = cli.executeOnText(body, filename)
  if (report.errorCount || report.warningCount) {
    res.status(400)
    res.send(cli.getFormatter()(report.results))
    return
  }
  res.status(200)
  res.send('')
})

app.post('/prettier', async (req, res) => {
  try {
    const { filename, baseDir, inPlace } = req.query
    const fullFilename = path.resolve(baseDir, filename)
    // eslint-disable-next-line no-sync
    const data = inPlace ? fs.readFileSync(fullFilename, 'utf-8') : req.body
    const prettier = requireLib(baseDir, 'prettier')
    const config = await prettier.resolveConfig(fullFilename)
    const output = prettier.format(data, { ...config, filepath: fullFilename })

    if (inPlace) {
      // eslint-disable-next-line no-sync
      fs.writeFileSync(fullFilename, output, 'utf-8')
    }
    res.send(output)
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

const server = app.listen(port)
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    process.exit(0)
  }
  log.error(err)
  process.exit(1)
})
const shutdownInterval = setInterval(maybeShutdown, +(process.env.BSS_DELAY || 6000))

function maybeShutdown() {
  if (new Date().valueOf() - lastRequest.valueOf() > 5 * 1000) {
    server.close()
    clearInterval(shutdownInterval)
  }
}

function requireLib(dir: string, library: string): any {
  if (dir === '/') throw new Error('Failed to find ' + library)
  const libraryDir = path.join(dir, 'node_modules', library)
  if (!fs.existsSync(libraryDir)) {
    return requireLib(path.join(dir, '..'), library)
  }
  const packageJson = require(path.join(libraryDir, 'package.json'))
  const libFile = path.join(libraryDir, packageJson.main)
  return require(libFile)
}
