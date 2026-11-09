/**
 * Options a start of Taktra takes on its command line. A second start hands them to the running
 * instance and quits, so they can make it do something but cannot answer.
 */
export interface LaunchOptions {
  readonly startActivity?: number
  readonly stopTimer?: boolean
}

/** The launch options as they stand on the command line, before they are validated. */
export interface LaunchArgs {
  readonly startActivity?: string
  readonly stopTimer?: boolean
}

const START_ACTIVITY = '--start-activity='
const STOP_TIMER = '--stop-timer'

/** Chromium may add or reorder arguments, so the options are searched anywhere in the list. */
export function readLaunchArgs(argv: readonly string[]): LaunchArgs {
  const start = argv.find((arg) => arg.startsWith(START_ACTIVITY))
  return {
    ...(start !== undefined ? { startActivity: start.slice(START_ACTIVITY.length) } : {}),
    ...(argv.includes(STOP_TIMER) ? { stopTimer: true } : {})
  }
}

export function toLaunchArgs({ startActivity, stopTimer }: LaunchOptions): string[] {
  return [
    ...(startActivity !== undefined ? [`${START_ACTIVITY}${startActivity}`] : []),
    ...(stopTimer ? [STOP_TIMER] : [])
  ]
}

export function hasLaunchArgs(args: LaunchArgs): boolean {
  return Object.keys(args).length > 0
}
