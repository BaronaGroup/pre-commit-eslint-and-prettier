import * as cp from 'child_process'
import * as os from 'os'

import identity from 'lodash/identity'
import range from 'lodash/range'

import { ChildMessage, LintResult } from './ChildMessage'
import { getCliEngine } from './runEslint'

async function run() {
  let success = true
  const files = getFilesInCommit()
  const maxRunners = Math.min(os.cpus().length, files.length)

  const lintResults: LintResult[] = []

  await Promise.all(
    range(0, maxRunners).map(
      () =>
        new Promise(resolve => {
          const child = cp.fork(__dirname + '/child')
          child.on('message', (message: ChildMessage) => {
            switch (message.cmd) {
              case 'sendNext':
                child.send(
                  identity<ChildMessage>({ cmd: 'next', file: files.shift() ?? null })
                )
                break
              case 'fail':
                success = false
                break
              case 'runCommand':
                const output = cp.execSync(message.commandline, { input: message.input }).toString('utf-8')
                child.send(
                  identity<ChildMessage>({ cmd: 'ranCommand', output })
                )
                break
              case 'eslintResults':
                lintResults.push(...message.results)
                break
              default:
                console.error('Cannot handle command ' + message.cmd)
                break
            }
          })
          child.on('error', err => {
            console.log('Child error', err)
          })
          child.on('exit', (code, signal) => {
            if (!code && !signal) {
              return resolve()
            }
            success = false
            if (code) {
              console.error('Child exited with code ' + code)
            } else if (signal) {
              console.error('Child exited with signal ' + signal)
            }
            return resolve()
          })
        })
    )
  )
  if (lintResults.length) {
    console.log(getCliEngine(process.cwd()).getFormatter()(lintResults))
  }

  if (!success) {
    process.exit(21)
  }
}
run().catch(err => {
  console.error(err.stack)
  process.exit(20)
})

function getFilesInCommit() {
  return cp
    .execSync(`git --no-pager diff --diff-filter=d --name-only --cached`)
    .toString('utf-8')
    .split('\n')
    .filter(x => x)
}
