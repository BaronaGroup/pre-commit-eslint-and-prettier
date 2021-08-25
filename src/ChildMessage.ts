import { CLIEngine } from 'eslint'

export type LintResult = ReturnType<CLIEngine['executeOnText']>['results']

export type ChildMessage =
  | { cmd: 'sendNext' }
  | { cmd: 'fail' }
  | { cmd: 'next'; file: string | null }
  | { cmd: 'runCommand'; commandline: string; input: string }
  | { cmd: 'ranCommand'; output: string }
  | { cmd: 'eslintResults'; results: LintResult[] }
