import * as cp from 'child_process'
import * as os from 'os'

import identity from 'lodash/identity'
import range from 'lodash/range'

import { ChildMessage } from './ChildMessage'

async function run() {
  let success = true
  const files = getFilesInCommit()
  const maxRunners = Math.min(os.cpus().length, files.length)
  await Promise.all(
    range(0, maxRunners).map(
      () =>
        new Promise(resolve => {
          const child = cp.fork(__dirname + '/child')
          child.on('message', (message: ChildMessage) => {
            if (message.cmd === 'sendNext') {
              child.send(
                identity<ChildMessage>({ cmd: 'next', file: files.shift() ?? null })
              )
            } else if (message.cmd === 'fail') {
              success = false
            } else if (message.cmd === 'runCommand') {
              const output = cp.execSync(message.commandline, { input: message.input }).toString('utf-8')
              child.send(
                identity<ChildMessage>({ cmd: 'ranCommand', output })
              )
            } else {
              console.error('Cannot handle command ' + message.cmd)
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
