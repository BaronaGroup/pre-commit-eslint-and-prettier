import * as cp from 'child_process'
import * as fs from 'fs'
import * as process from 'process'

const myPackageName = 'pre-commit-eslint-and-prettier'

const fullInstall = process.argv.includes('--full-install')
const packageFilename = process.cwd() + '/package.json'
if (!fs.existsSync(packageFilename)) {
  console.log('Run this command in a directory with a package.json')
  process.exit(1)
}

console.log('Installing dependencies')
if (fullInstall) {
  cp.execSync(`npm i -D prettier ${myPackageName} import-sort-style-module prettier-plugin-import-sort pre-commit`)
  let prettierRc = process.cwd() + '/.prettierrc'
  if (!fs.existsSync(prettierRc)) {
    fs.copyFileSync(__dirname + '/../.prettierrc', prettierRc)
  }
} else {
  cp.execSync(`npm i -D ${myPackageName} pre-commit`)
}
cp.execSync('npm rm barona_style_server')

console.log('Updating package.json')

const packageJSON = require(packageFilename)

if (!packageJSON['pre-commit']) packageJSON['pre-commit'] = []
const preCommit = packageJSON['pre-commit'] as string[]

// Remove obsolete versions of the script
preCommit.splice(preCommit.indexOf('bss_start-style-server'), 1)
preCommit.splice(preCommit.indexOf('barona_style_server'), 1)

if (!preCommit.includes(myPackageName)) {
  preCommit.push(myPackageName)
}

if (!packageJSON.scripts) packageJSON.scripts = {}

const scripts = packageJSON.scripts as { [name: string]: string }
if (scripts['barona_style_server']) delete scripts['barona_style_server']

scripts[myPackageName] = myPackageName

if (fullInstall) {
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
}

fs.writeFileSync(packageFilename, JSON.stringify(packageJSON, null, 2), 'utf8')
console.log('Done.')
