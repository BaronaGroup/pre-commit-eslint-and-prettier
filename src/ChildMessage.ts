export type ChildMessage =
  | { cmd: 'sendNext' }
  | { cmd: 'fail' }
  | { cmd: 'next'; file: string | null }
  | { cmd: 'runCommand'; commandline: string; input: string }
  | { cmd: 'ranCommand'; output: string }
