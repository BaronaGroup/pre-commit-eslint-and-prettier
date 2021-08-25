import { ChildMessage } from './ChildMessage'

export async function forMessage<T extends ChildMessage['cmd']>(
  messageId: T
): Promise<Extract<ChildMessage, { cmd: T }>> {
  return new Promise<any>(resolve => {
    process.on('message', (msg: ChildMessage) => {
      if (msg.cmd === messageId) {
        resolve(msg)
      }
    })
  })
}
