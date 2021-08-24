import * as cp from 'child_process'

import runEslint from './runEslint'
import runPrettier from './runPrettier'
import { cleanup } from './tempfile'

async function run() {
  let success = false
  try {
    const files = getFilesInCommit()
    await runPrettier(files)
    success = await runEslint(files)
  } finally {
    await cleanup()
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
