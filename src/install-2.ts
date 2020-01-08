import * as fs from 'fs'

const packageFilename = process.cwd() + '/package.json'
const packageJSON = require(packageFilename)

if (!packageJSON['pre-commit']) packageJSON['pre-commit'] = []
const preCommit = packageJSON['pre-commit'] as string[]

if (!preCommit.includes('bss_start-style-server')) {
  preCommit.push('barona_style_server')
}

if (!packageJSON.scripts) packageJSON.scripts = {}

const scripts = packageJSON.scripts as { [name: string]: string }
scripts['barona_style_server'] = './node_modules/barona-style-server/bin/run.sh'

packageJSON.importSort = {
  '.js, .jsx, .ts, .tsx': {
    style: 'module',
    parser: 'typescript',
  },
}

fs.writeFileSync(packageFilename, JSON.stringify(packageJSON, null, 2), 'utf8')
