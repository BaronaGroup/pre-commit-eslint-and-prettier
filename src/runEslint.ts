import * as cp from 'child_process'
import fs from 'fs'
import path from 'path'

import { identity } from 'lodash'
import memoize from 'lodash/memoize'

import { applyFix } from './applyFix'
import { ChildMessage } from './ChildMessage'
import { maxBuffer } from './contants'
import requireLib from './requireLib'

export const getCliEngine = memoize(dir => {
  const cwd = process.cwd()
  process.chdir(dir)
  const cli = new (requireLib(dir, 'eslint').CLIEngine)({ fix: true })
  process.chdir(cwd)
  return cli
})

export default async function runEslint(filename: string) {
  const validFileMatcher = /\.(ts|js|jsx|tsx)$/
  if (!filename.match(validFileMatcher)) return true

  const cli = getCliEngine(path.dirname(path.resolve(process.cwd(), filename)))
  const contents = await new Promise<string>((resolve, reject) =>
    cp.exec(`git show :${filename}`, { maxBuffer }, (err, stdout) => {
      if (err) {
        return reject(err)
      } else {
        resolve(stdout)
      }
    })
  )
  const report = cli.executeOnText(contents, filename)

  if (report.results[0].output) {
    await applyFix(contents, report.results[0].output, filename)

    // Also fix on disk
    try {
      const diskFile = await fs.promises.readFile(filename, 'utf-8')
      const report = cli.executeOnText(diskFile, filename)
      if (report.results[0].output) {
        await fs.promises.writeFile(filename, report.results[0].output, 'utf-8')
      }
    } catch (err) {
      console.warn('Could not make the disk file prettier due to ', err.stack)
    }
  }
  if (report.errorCount || report.warningCount) {
    process.send!(
      identity<ChildMessage>({ cmd: 'eslintResults', results: report.results })
    )

    return false
  } else {
    return true
  }
}
