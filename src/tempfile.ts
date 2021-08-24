import { randomBytes } from 'crypto'
import * as fs from 'fs'
import * as os from 'os'

const tempDir = fs.mkdtempSync(os.tmpdir() + '/peap')
const tempFiles: string[] = []

export function cleanup() {
  for (const file of tempFiles) {
    fs.unlinkSync(file)
  }
  fs.rmdirSync(tempDir)
}

export async function getTempFile() {
  const fn = tempDir + '/' + randomBytes(8).toString('hex')
  tempFiles.push(fn)
  return fn
}
