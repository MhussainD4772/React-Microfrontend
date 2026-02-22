# MFE2 — Micro-Frontend Remote

MFE2 is an independently runnable React + Vite remote using **Module Federation** (`@originjs/vite-plugin-federation`). It follows the same enterprise contract as MFE1 and is designed for later federation into the host-shell.

## Install and run

```bash
cd mfe2
npm install
npm run dev
```

- **Port:** 5174
- **URL:** http://localhost:5174

## Exposed module

- **`./mount`** — Entry used by the host to mount/unmount the MFE.

## Mount contract

### `mount(container, props)`

- **`container`** — `HTMLElement` to render into.
- **`props`** — `MountProps`:
  - `appId`: `"mfe2"`
  - `version`: `"1.0.0"`
  - `initialState?`: `{ bulbOn?: boolean }`
  - `eventBus?`: `{ emit(msg), on(type, handler) => unsubscribe }`
- **Returns:** `{ unmount: () => void }` for cleanup.

### `unmount(container)`

- **`container`** — Same `HTMLElement` used for `mount`.
- Unmounts the React root from the container. Safe to call multiple times.

## Remote entry (federation)

For host integration, the remote entry is served at:

- **Dev:** http://localhost:5174/remoteEntry.js or http://localhost:5174/assets/remoteEntry.js
- **Build:** The built `remoteEntry.js` is in `dist/assets/remoteEntry.js`.

Configure the host to load this URL when using Module Federation.

## Behaviour

- **Standalone:** Running `npm run dev` mounts MFE2 on `#root` with default props and no `eventBus`; the UI shows “Standalone mode”.
- **With eventBus:** When provided by the host, MFE2 emits `BULB_SET_REQUEST` on toggle and subscribes to `BULB_STATE_CHANGED`, updating the bulb only when `mfe2` is in the message `targets`.

## Scripts

| Script    | Command                    | Description                   |
| --------- | -------------------------- | ----------------------------- |
| `dev`     | `vite --port 5174`         | Start dev server on port 5174 |
| `build`   | `tsc -b && vite build`     | Type-check and build          |
| `preview` | `vite preview --port 4174` | Preview production build      |
