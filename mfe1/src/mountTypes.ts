export type MountProps = {
  appId: 'mfe1'
  version: string
  initialState?: { bulbOn?: boolean }
  initialTargets?: string[]
  eventBus?: {
    emit: (msg: unknown) => void
    on: (type: string, handler: (msg: unknown) => void) => () => void
  }
}
