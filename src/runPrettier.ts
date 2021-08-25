import * as cp from 'child_process'
import * as fs from 'fs'
import path from 'path'

import { applyFix } from './applyFix'
import requireLib from './requireLib'

export default async function preparePrettier() {
  const prettier = requireLib(process.cwd(), 'prettier')
  const prettierConfig = await prettier.resolveConfig(process.cwd()) // TODO: allow config files from deeper in the repos

  return async (filename: string) => {
    const validFileMatcher = /\.(json|ts|js|jsx|tsx|html|css|less)$/
    if (!filename.match(validFileMatcher)) return

    const contents = await new Promise<string>((resolve, reject) =>
      cp.exec(`git show :${filename}`, (err, stdout) => {
        if (err) {
          return reject(err)
        } else {
          resolve(stdout)
        }
      })
    )

    const prettierContents = await makePrettier(filename, process.cwd(), contents)

    if (prettierContents !== contents) {
      await applyFix(contents, prettierContents, filename)

      // Run prettier on the full file on the disk
      try {
        const diskFile = await fs.promises.readFile(filename, 'utf-8')
        const prettierDiskFile = await makePrettier(filename, process.cwd(), diskFile)
        await fs.promises.writeFile(filename, prettierDiskFile, 'utf-8')
      } catch (err) {
        console.warn('Could not make the disk file prettier due to ', err.stack)
      }
    }

    function makePrettier(filename: string, baseDir: string, code: string) {
      const fullFilename = path.resolve(baseDir, filename)
      // eslint-disable-next-line no-sync
      return prettier.format(code, { ...prettierConfig, filepath: fullFilename })
    }
  }
}
