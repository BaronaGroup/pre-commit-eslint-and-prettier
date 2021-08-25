import identity from 'lodash/identity'

import { ChildMessage } from './ChildMessage'
import { forMessage } from './forMessage'
import runEslint from './runEslint'
import preparePrettier from './runPrettier'
import { cleanup } from './tempfile'

async function run() {
  let running = true
  const prettier = await preparePrettier()

  while (running) {
    process.send!(
      identity<ChildMessage>({ cmd: 'sendNext' })
    )
    const next = await forMessage('next')
    if (!next.file) {
      running = false
    } else {
      await prettier(next.file)
      const success = await runEslint(next.file)
      if (!success) {
        process.send!(
          identity<ChildMessage>({ cmd: 'fail' })
        )
      }
    }
  }
  cleanup()
  process.exit(0)
}

run().catch(err => {
  cleanup()
  console.error(err.stack)
  process.exit(23)
})
