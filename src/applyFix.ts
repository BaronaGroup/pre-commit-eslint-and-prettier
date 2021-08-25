import cp from 'child_process'
import fs from 'fs'

import identity from 'lodash/identity'

import { ChildMessage } from './ChildMessage'
import { maxBuffer } from './contants'
import { forMessage } from './forMessage'
import { getTempFile } from './tempfile'

export async function applyFix(contents: string, fixedContents: string, filename: string) {
  const commitedTemp = await getTempFile()
  const prettierTemp = await getTempFile()

  await fs.promises.writeFile(commitedTemp, contents, 'utf-8')
  await fs.promises.writeFile(prettierTemp, fixedContents, 'utf-8')

  const patch = (
    await new Promise<string>((resolve, reject) =>
      cp.exec(`git diff --no-index ${commitedTemp} ${prettierTemp}`, { maxBuffer }, (err, stdout, stderr) => {
        if (err) {
          if (stdout) return resolve(stdout)
          if (stderr) {
            return reject(new Error(stderr))
          }
          return reject(err)
        } else {
          resolve(stdout)
        }
      })
    )
  )
    .replace(new RegExp(commitedTemp, 'g'), `/${filename}`)
    .replace(new RegExp(prettierTemp, 'g'), `/${filename}`)

  process.send!(
    identity<ChildMessage>({ cmd: 'runCommand', commandline: `git apply --cached`, input: patch })
  )
  await forMessage('ranCommand')
}
