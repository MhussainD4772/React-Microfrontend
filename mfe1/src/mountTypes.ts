export type MountProps = {
  appId: 'mfe1'
  version: string
  initialState?: { bulbOn?: boolean }
  eventBus?: {
    emit: (msg: unknown) => void
    on: (type: string, handler: (msg: unknown) => void) => () => void
  }
}
