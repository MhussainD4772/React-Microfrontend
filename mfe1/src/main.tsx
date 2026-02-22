import { mount } from './mount'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

const defaultProps = {
  appId: 'mfe1' as const,
  version: '1.0.0',
  initialState: { bulbOn: false },
  eventBus: undefined,
}

mount(root, defaultProps)
