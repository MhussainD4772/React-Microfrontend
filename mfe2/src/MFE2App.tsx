import { useState, useCallback, useEffect, useRef } from "react";

const CONTRACT_VERSION = "1.0.0";

type EventBus = {
  emit: (msg: unknown) => void;
  on: (type: string, handler: (msg: unknown) => void) => () => void;
};

type MFE2AppProps = {
  appId: "mfe2";
  version: string;
  initialBulbOn: boolean;
  initialTargets?: string[];
  eventBus?: EventBus;
};

const TARGET_IDS = ["host", "mfe1", "mfe2", "mfe3"] as const;
const TARGET_LABELS: Record<string, string> = {
  host: "Host",
  mfe1: "MFE1",
  mfe2: "MFE2",
  mfe3: "MFE3",
};

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function MFE2App({
  appId,
  version,
  initialBulbOn,
  initialTargets,
  eventBus,
}: MFE2AppProps) {
  const [bulbOn, setBulbOn] = useState(initialBulbOn ?? false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>(
    initialTargets ?? ["mfe2"],
  );
  const [pulseBulb, setPulseBulb] = useState(false);
  const prevBulbRef = useRef(initialBulbOn ?? false);
  const isStandalone = !eventBus;

  useEffect(() => {
    if (!eventBus?.on) return;
    const unsub = eventBus.on("BULB_STATE_CHANGED", (msg: unknown) => {
      const m = msg as { type: string; targets?: string[]; state?: boolean };
      if (m?.targets?.includes("mfe2")) setBulbOn(!!m.state);
    });
    return () => unsub();
  }, [eventBus]);

  useEffect(() => {
    if (prevBulbRef.current !== bulbOn) {
      prevBulbRef.current = bulbOn;
      setPulseBulb(true);
    }
  }, [bulbOn]);

  useEffect(() => {
    if (!pulseBulb) return;
    const t = setTimeout(() => setPulseBulb(false), 500);
    return () => clearTimeout(t);
  }, [pulseBulb]);

  const handleTargetChange = useCallback((value: string, checked: boolean) => {
    setSelectedTargets((prev) =>
      checked
        ? [...prev, value].filter((v, i, a) => a.indexOf(v) === i).sort()
        : prev.filter((v) => v !== value),
    );
  }, []);

  const handleToggleTargets = useCallback(() => {
    const nextState = !bulbOn;
    if (eventBus) {
      eventBus.emit({
        type: "BULB_SET_REQUEST",
        version: CONTRACT_VERSION,
        source: "mfe2",
        targets: selectedTargets,
        payload: { state: nextState },
        correlationId: generateCorrelationId(),
      });
    }
  }, [bulbOn, eventBus, selectedTargets]);

  return (
    <div className="w-full flex justify-center p-3 min-h-[280px]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur shadow-xl shadow-slate-200/50 p-6 animate-fade-in-up hover:shadow-2xl hover:shadow-sky-100/50 hover:-translate-y-0.5 transition-all duration-300">
        <h2 className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-4">
          MFE2
        </h2>
        <div className="flex justify-center mb-5">
          <div
            className={`w-16 h-16 rounded-full border-4 transition-all duration-300 ${pulseBulb ? "animate-bulb-pulse" : ""} ${
              bulbOn
                ? "bg-amber-400 border-amber-500 shadow-[0_0_28px_rgba(251,191,36,0.6)]"
                : "bg-slate-400 border-slate-500"
            }`}
            title={bulbOn ? "ON" : "OFF"}
            aria-label={bulbOn ? "Bulb on" : "Bulb off"}
          />
        </div>
        <button
          type="button"
          onClick={handleToggleTargets}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] shadow-lg shadow-sky-200 hover:shadow-sky-300/60 transition-all duration-200 mb-5"
        >
          Toggle Targets
        </button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Select which apps to turn on/off when you toggle
          </p>
          {TARGET_IDS.map((id) => (
            <label
              key={id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                checked={selectedTargets.includes(id)}
                onChange={(e) => handleTargetChange(id, e.target.checked)}
                className="sr-only peer"
              />
              <span className="mfe-toggle-track w-12 h-7 rounded-full bg-slate-200 flex-shrink-0 transition-colors" />
              <span className="font-medium text-slate-700 group-hover:text-slate-900">
                {TARGET_LABELS[id]}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          appId: {appId} · version: {version}
          {isStandalone && " · Standalone"}
        </p>
      </div>
    </div>
  );
}
