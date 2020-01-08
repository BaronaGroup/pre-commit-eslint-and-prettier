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

if (!scripts.prettier) {
  if (fs.existsSync(__dirname + '/tsconfig.json')) {
    const tsconfig = require(__dirname + '/tsconfig.json')
    if (tsconfig.include) {
      const paths = (tsconfig.include as string[])
        .map(x => x.match(/^[\w/]+/) || [''])
        .map(x => x[0])
        .filter(x => x)
        .map(x => (x.endsWith('/') ? x.substring(0, x.length - 1) : x))
      if (paths.length) {
        const pathStr = paths.join(' ')
        scripts.prettier = `find ${pathStr} -name '*.js' -or -name '*.jsx' -or -name '*.ts' -or -name '*.tsx' | xargs prettier --write`
      }
    }
  }
}

fs.writeFileSync(packageFilename, JSON.stringify(packageJSON, null, 2), 'utf8')
