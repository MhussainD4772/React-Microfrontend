# MFE1 — Remote Micro-Frontend

Phase 2: Independently runnable React + Vite remote using Module Federation (`@originjs/vite-plugin-federation`). Exposes a framework-agnostic **mount** / **unmount** contract.

## Install & Run

```bash
cd mfe1
npm install
npm run dev
```

- **Dev:** http://localhost:5173 (standalone UI)
- **Preview (after build):** `npm run build && npm run preview` → http://localhost:4173

## What This Phase Contains

- **Vite + React + TypeScript** app
- **Module Federation** config: name `mfe1`, filename `remoteEntry.js`
- **Exposed module:** `./mount` → `src/mount.tsx`
- **Mount/unmount contract** for the host to load and render the MFE in a container

## Exposed Module

The host (or any consumer) loads:

- **Remote name:** `mfe1`
- **Module:** `./mount`

From `src/mount.tsx` you get:

- **`mount(container, props)`** — Renders MFE1 into `container`; returns `{ unmount }`.
- **`unmount(container)`** — Unmounts and cleans up.

## Mount Contract

**MountProps:**

| Field          | Type     | Description                      |
| -------------- | -------- | -------------------------------- |
| `appId`        | `"mfe1"` | App identifier                   |
| `version`      | `string` | Version string                   |
| `initialState` | optional | `{ bulbOn?: boolean }`           |
| `eventBus`     | optional | `{ emit, on }` for host mediator |

**Signatures:**

- `mount(container: HTMLElement, props: MountProps): { unmount: () => void }`
- `unmount(container: HTMLElement): void`

When `eventBus` is provided, the MFE emits **BULB_SET_REQUEST** (shared event contract) on toggle. When it is not provided, the UI shows “Standalone mode” and only local state is updated.

## Dev Port

- **5173** — `npm run dev`
- **4173** — `npm run preview` (after build)

## Remote Entry (for host)

- **Development:** The Vite dev server does not serve `remoteEntry.js` (bundleless). To test host + remote together, build and use preview: `npm run build && npm run preview`; then point the host at e.g. `http://localhost:4173/remoteEntry.js`.
- **Production / Preview:** After `npm run build`, `remoteEntry.js` is at `dist/assets/remoteEntry.js`. With `npm run preview`, use `http://localhost:4173/assets/remoteEntry.js`. For a deployed MFE1 origin, use `https://<mfe1-origin>/assets/remoteEntry.js` (or the root path your server uses for assets).

## Scripts

| Script    | Command                    | Purpose                |
| --------- | -------------------------- | ---------------------- |
| `dev`     | `vite --port 5173`         | Standalone dev server  |
| `build`   | `tsc -b && vite build`     | Type-check + build     |
| `preview` | `vite preview --port 4173` | Serve production build |
