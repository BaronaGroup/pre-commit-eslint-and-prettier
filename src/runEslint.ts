import * as cp from 'child_process'
import fs from 'fs'
import path from 'path'

import { identity } from 'lodash'
import memoize from 'lodash/memoize'

import { applyFix } from './applyFix'
import { ChildMessage } from './ChildMessage'
import { maxBuffer } from './contants'
import requireLib from './requireLib'

export const getCliEngine = memoize((dir) => {
  const cwd = process.cwd()
  process.chdir(dir)
  const eslintLib = requireLib(dir, 'eslint')
  const cli = new (eslintLib.CLIEngine ?? eslintLib.ESLint)({ fix: true })
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
  const report = unifyEslintReport(
    cli.executeOnText ? cli.executeOnText(contents, filename) : await cli.lintText(contents, { filePath: filename })
  )

  if (report.output) {
    await applyFix(contents, report.output, filename)

    // Also fix on disk
    try {
      const diskFile = await fs.promises.readFile(filename, 'utf-8')
      const report = unifyEslintReport(
        cli.executeOnText ? cli.executeOnText(diskFile, filename) : await cli.lintText(diskFile, { filePath: filename })
      )
      if (report.output) {
        await fs.promises.writeFile(filename, report.output, 'utf-8')
      }
    } catch (err) {
      console.warn('Could not make the disk file prettier due to ', err.stack)
    }
  }
  if (report.errorCount || report.warningCount) {
    process.send!(identity<ChildMessage>({ cmd: 'eslintResults', results: [report as any] }))

    return false
  } else {
    return true
  }
}

function unifyEslintReport(
  report:
    | Array<{ errorCount: number; warningCount: number; output?: string }>
    | { errorCount: number; warningCount: number; results: Array<{ output?: string }> }
) {
  if (Array.isArray(report)) {
    if (!report.length) {
      return { errorCount: 0, warningCount: 0 }
    }
    return report[0]
  } else {
    return {
      ...report.results[0],
      errorCount: report.errorCount,
      warningCount: report.warningCount,
    }
  }
}
