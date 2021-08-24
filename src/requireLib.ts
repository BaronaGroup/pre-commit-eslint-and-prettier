import fs from 'fs'
import path from 'path'

export default function requireLib(dir: string, library: string): any {
  if (dir === '/') throw new Error('Failed to find ' + library)
  const libraryDir = path.join(dir, 'node_modules', library)
  if (!fs.existsSync(libraryDir)) {
    return requireLib(path.join(dir, '..'), library)
  }
  const packageJson = require(path.join(libraryDir, 'package.json'))
  const libFile = path.join(libraryDir, packageJson.main)
  return require(libFile)
}
