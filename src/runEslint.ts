import * as cp from 'child_process'
import fs from 'fs'
import path from 'path'

import memoize from 'lodash/memoize'

import { applyFix } from './applyFix'
import requireLib from './requireLib'

const getCliEngine = memoize(dir => {
  const cwd = process.cwd()
  process.chdir(dir)
  const cli = new (requireLib(dir, 'eslint').CLIEngine)({ fix: true })
  process.chdir(cwd)
  return cli
})

export default async function runEslint(potentialFiles: string[]) {
  const validFileMatcher = /\.(ts|js|jsx|tsx)$/
  const files = potentialFiles.filter(x => x.match(validFileMatcher))

  let allOk = true
  for (const filename of files) {
    const cli = getCliEngine(path.dirname(path.resolve(process.cwd(), filename)))
    const contents = await new Promise<string>((resolve, reject) =>
      cp.exec(`git show :${filename}`, (err, stdout) => {
        if (err) {
          return reject(err)
        } else {
          resolve(stdout)
        }
      })
    )
    const report = cli.executeOnText(contents, filename)
    if (report.errorCount || report.warningCount) {
      console.log(cli.getFormatter()(report.results))
      allOk = false
    }
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
  }
  return allOk
}
