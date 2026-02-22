import { useState, useCallback } from 'react'

const CONTRACT_VERSION = '1.0.0'

type EventBus = {
  emit: (msg: unknown) => void
  on: (type: string, handler: (msg: unknown) => void) => () => void
}

type MFE1AppProps = {
  appId: 'mfe1'
  version: string
  initialBulbOn: boolean
  eventBus?: EventBus
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export default function MFE1App({ appId, version, initialBulbOn, eventBus }: MFE1AppProps) {
  const [bulbOn, setBulbOn] = useState(initialBulbOn)
  const isStandalone = !eventBus

  const handleToggle = useCallback(() => {
    const next = !bulbOn
    setBulbOn(next)
    if (eventBus) {
      eventBus.emit({
        type: 'BULB_SET_REQUEST',
        version: CONTRACT_VERSION,
        source: appId,
        targets: ['host', 'mfe1', 'mfe2'],
        payload: { state: next },
        correlationId: generateCorrelationId(),
      })
    }
  }, [bulbOn, eventBus, appId])

  return (
    <div className="mfe1">
      <h1>MFE1</h1>
      <div className="bulb-container">
        <div
          className={`bulb ${bulbOn ? 'on' : 'off'}`}
          title={bulbOn ? 'ON' : 'OFF'}
          aria-label={bulbOn ? 'Bulb on' : 'Bulb off'}
        />
      </div>
      <button type="button" onClick={handleToggle}>
        Toggle Bulb (MFE1)
      </button>
      <p className="mfe1-meta">
        appId: {appId} · version: {version}
        {isStandalone && ' · Standalone mode'}
      </p>
    </div>
  )
}
