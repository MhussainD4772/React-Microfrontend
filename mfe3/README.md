# MFE3 — Web Component (same bulb UI as MFE1/MFE2)

Same purpose as MFE1 and MFE2 (one bulb, toggle targets, event contract), but built as a **Web Component**.

## How it's done

### 1. Custom element

- **Class:** Extend `HTMLElement` and implement the same behavior as the React app (bulb state, targets, emit/subscribe).

- **Registration:** `customElements.define('mfe3-bulb', Mfe3Bulb)` so the browser understands `<mfe3-bulb>`.

- **No `mount()`:** The host does not call a mount function. It creates the element, appends it, then sets properties.

### 2. Shadow DOM

- **`this.attachShadow({ mode: 'open' })`** gives a scoped subtree. All markup and CSS live inside the shadow root.

- Host styles don’t affect the component; component styles don’t affect the host. Same visual result as MFE1/MFE2, with encapsulation.

### 3. Configuration via properties

The host appends `<mfe3-bulb>` and then sets:

- `element.eventBus = HostEventBus.getEventBusForMfe()` — same bus as MFE1/MFE2.
- `element.initialState = { bulbOn }` — so the bulb matches mediator state.
- `element.initialTargets = ['mfe3']` — default targets.
- `element.appId = 'mfe3'` — for the event contract.

Setters on the class run the logic (e.g. when `eventBus` is set, we subscribe to `BULB_STATE_CHANGED`).

### 4. Same event contract

- **Emit:** On “Toggle Targets” we call `eventBus.emit({ type: 'BULB_SET_REQUEST', source: 'mfe3', targets, payload: { state }, correlationId, ... })`.

- **Subscribe:** `eventBus.on('BULB_STATE_CHANGED', handler)`. If `msg.targets` includes `mfe3`, we update local state and re-render the bulb.

So the mediator and other MFEs don’t need to know whether an app is React or a Web Component.

### 5. Loading (no Module Federation)

- **MFE1/MFE2:** Host uses `import(remoteEntry.js)` and `container.get('./mount')`, then `mount(container, props)`.

- **MFE3:** Host loads a script (e.g. `http://localhost:5175/src/main.js` in dev). The script runs and calls `customElements.define('mfe3-bulb', ...)`. Then the host creates `<mfe3-bulb>`, sets the properties above, and appends it to the slot.

### 6. Lifecycle

- **connectedCallback:** Build the UI (bulb, button, target checkboxes) and attach to the shadow root.
- **disconnectedCallback:** Unsubscribe from the event bus so there are no leaks when the modal is closed.

## Run

```bash
# From repo root
cd mfe3
npm install
npm run dev   # serves at http://localhost:5175; host loads /src/main.js
```

With the host running, open “Open MFE3” and use the bulb and targets like MFE1/MFE2.

## Build

```bash
npm run build   # outputs dist/mfe3.js
```

For production, point the host at the built script (e.g. your CDN or static server) instead of the Vite dev server.
