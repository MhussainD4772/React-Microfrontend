import { useState, useCallback, useEffect } from "react";

const CONTRACT_VERSION = "1.0.0";

type EventBus = {
  emit: (msg: unknown) => void;
  on: (type: string, handler: (msg: unknown) => void) => () => void;
};

type BULB_STATE_CHANGED_MSG = {
  type: "BULB_STATE_CHANGED";
  version: string;
  targets: string[];
  state: boolean;
  correlationId: string;
};

type MFE2AppProps = {
  appId: "mfe2";
  version: string;
  initialBulbOn: boolean;
  eventBus?: EventBus;
};

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function MFE2App({
  appId,
  version,
  initialBulbOn,
  eventBus,
}: MFE2AppProps) {
  const [bulbOn, setBulbOn] = useState(initialBulbOn);
  const isStandalone = !eventBus;

  const handleToggle = useCallback(() => {
    const next = !bulbOn;
    setBulbOn(next);
    if (eventBus) {
      eventBus.emit({
        type: "BULB_SET_REQUEST",
        version: CONTRACT_VERSION,
        source: appId,
        targets: ["host", "mfe1", "mfe2"],
        payload: { state: next },
        correlationId: generateCorrelationId(),
      });
    }
  }, [bulbOn, eventBus, appId]);

  useEffect(() => {
    if (!eventBus?.on) return;
    const unsubscribe = eventBus.on(
      "BULB_STATE_CHANGED",
      (msg: unknown) => {
        const m = msg as BULB_STATE_CHANGED_MSG;
        if (m?.type === "BULB_STATE_CHANGED" && m?.targets?.includes(appId)) {
          setBulbOn(m.state);
        }
      },
    );
    return () => unsubscribe();
  }, [eventBus, appId]);

  return (
    <div className="mfe2">
      <h1>MFE2</h1>
      <div className="bulb-container">
        <div
          className={`bulb ${bulbOn ? "on" : "off"}`}
          title={bulbOn ? "ON" : "OFF"}
          aria-label={bulbOn ? "Bulb on" : "Bulb off"}
        />
      </div>
      <button type="button" onClick={handleToggle}>
        Toggle Bulb (MFE2)
      </button>
      <p className="mfe2-meta">
        appId: {appId} · version: {version}
        {isStandalone && " · Standalone mode"}
      </p>
    </div>
  );
}
